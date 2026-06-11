"""
ML Inference Engine for the Campus AI Backend.

Adapts the full social_isolation_pipeline.py (Phases 1-4) for real-time,
single-student inference.  All preprocessing, feature engineering,
clustering, anomaly detection, and false-positive filtering logic is
replicated exactly from the original pipeline.
"""

import os
import re
import logging
import warnings
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.mixture import GaussianMixture
from sklearn.svm import OneClassSVM
from sklearn.preprocessing import MinMaxScaler, StandardScaler

from models import AssessmentInput, PredictionResponse, RecommendationPayload

warnings.filterwarnings("ignore")
logger = logging.getLogger("ml_engine")

# ---------------------------------------------------------------------------
# Constants — identical to social_isolation_pipeline.py
# ---------------------------------------------------------------------------
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

COLUMN_MAP = {
    "Timestamp": "timestamp",
    "Name:": "name",
    "University/Institution Name \nWrite abbreviation only (e.g NUST, NUTECH, FAST)": "university",
    "Semester:": "semester",
    "Living Status": "living_status",
    "How many friends are in your group?": "friend_group_size",
    "How much does the presence of friends influence your decision to attend university events or classes?  ": "friend_influence",
    "Academic Performance:": "academic_performance",
    "Current CGPA (e.g., 3.45)": "cgpa",
    "Average Class Attendance Rate (Weekly)": "class_attendance",
    "Average Daily Self-Study Hours": "daily_self_study_hours",
    "Number of Active Society Memberships": "society_memberships",
    "Do you contribute/help/join society events?": "contributes_to_societies",
    "How many society meetings/events did you attend this semester?": "society_events_attended",
    "Do you play for any sports at University?": "plays_sports",
    "Do you enjoy physical Campus Presence?": "enjoys_campus_presence",
    "Number of meals eaten with friends on average in a week?": "meals_with_friends",
    "Total hours spent in personal space/alone on average in a week?": "hours_alone_weekly",
    "Frequency of using Common Rooms/Student Lounges/Library Rooms": "common_room_frequency",
    "How many times did you leave campus for social reasons this week? (Gatherings, events, trips, hangout, etc)": "social_outings",
    "Number of Assignments/Quizzes due this week?": "assignments_due",
    "Perceived Academic Workload Stress": "workload_stress",
    "How well did you manage your workload this week?": "workload_management",
    "Average daily Screen Time on your phone (Hours)? (In weekdays)": "screen_time",
    "Average hours of sleep per night? (in weekdays)": "sleep_hours",
    "Do you mostly skip breakfast/lunch in the cafeteria?": "skips_meals",
    "How would you rate your social interaction and wellness?": "social_wellness_rating",
    "How would you rate your overall mood this week?": "mood_rating",
    "How often did you feel socially isolated or lonely this week?": "loneliness_score",
    "Satisfaction with your peer interactions": "peer_satisfaction",
    "Which of the following spaces do you primarily use for studying/academic work? (Select all that apply)": "study_spaces",
    "Rank the following factors based on how much they contribute to your feeling of social isolation (1 being the highest contributor): [Heavy academic workload]": "isolation_factor_workload",
    "Rank the following factors based on how much they contribute to your feeling of social isolation (1 being the highest contributor): [Lack of common interest with peers]": "isolation_factor_peers",
    "Rank the following factors based on how much they contribute to your feeling of social isolation (1 being the highest contributor): [Digital distractions (Screen time)]": "isolation_factor_digital",
    "Rank the following factors based on how much they contribute to your feeling of social isolation (1 being the highest contributor): [Living status (Hostelite vs. Day Scholar)]": "isolation_factor_living",
    "How would you rate the helpfulness of your peers/friends in academic matters (e.g., studying for exams, assignments)?": "peer_helpfulness",
}

MODELING_FEATURES: List[str] = [
    "friend_group_size",
    "friend_influence",
    "cgpa",
    "class_attendance",
    "daily_self_study_hours",
    "society_memberships",
    "society_events_attended",
    "meals_with_friends",
    "hours_alone_weekly",
    "common_room_frequency",
    "social_outings",
    "assignments_due",
    "workload_stress",
    "workload_management",
    "screen_time",
    "sleep_hours",
    "social_wellness_rating",
    "mood_rating",
    "loneliness_score",
    "peer_satisfaction",
    "peer_helpfulness",
    "Social_Density_Score",
]

# Columns used to build Social Density Score
COMMUNAL_COLS = ["meals_with_friends", "common_room_frequency", "social_outings"]
ISOLATION_COL = "hours_alone_weekly"


class MLEngine:
    """
    Self-contained ML inference engine.

    On initialisation it:
      1. Loads and preprocesses the campus-wide dataset (Phase 1).
      2. Engineers the Social Density Score feature (Phase 2).
      3. Fits StandardScaler, KMeans(k=3), and IsolationForest(n=200)
         on the full dataset (Phase 3).
      4. Runs the false-positive filter to discover cluster-label
         mappings and thresholds (Phase 4).
      5. Computes campus-wide baselines for the radar chart.

    After init, ``predict(input)`` scores a single student in < 5 ms.
    """

    # ------------------------------------------------------------------
    # Construction
    # ------------------------------------------------------------------
    def __init__(self, dataset_path: str) -> None:
        logger.info("Initialising MLEngine from %s", dataset_path)

        if not os.path.isfile(dataset_path):
            raise FileNotFoundError(
                f"Dataset not found at '{dataset_path}'. "
                "Ensure ML-Dataset.csv is accessible."
            )

        # ---- Phase 1: Data Ingestion & Preprocessing --------------------
        self.df = self._phase1_preprocess(dataset_path)

        # ---- Phase 2: Feature Engineering (SDS) -------------------------
        self.df, self.communal_scaler, self.isolation_scaler = (
            self._phase2_feature_engineering(self.df)
        )

        # ---- Phase 3: Core Unsupervised Modeling ------------------------
        (
            self.standard_scaler,
            self.kmeans,
            self.isolation_forest,
            self.contamination_rate,
        ) = self._phase3_modeling(self.df)

        # ---- Phase 3 Extensions: LOF, OCSVM, GMM -------------------------
        self.lof_reference_scores = self._fit_lof()
        self.ocsvm = self._fit_ocsvm()
        self.gmm, self.gmm_at_risk_component = self._fit_gmm()

        # ---- Phase 4: Derive cluster-label map & thresholds -------------
        self.cluster_label_map = self._derive_cluster_label_map()
        self.df["Cluster_Label"] = self.df["Cluster_ID"].map(self.cluster_label_map)

        # False-positive thresholds (computed from training set)
        self.study_75th = self.df["daily_self_study_hours"].quantile(0.75)
        self.cgpa_threshold = 3.0
        self.attendance_threshold = 4
        self.social_density_median = self.df["Social_Density_Score"].median()
        self.screen_time_75th = self.df["screen_time"].quantile(0.75)
        self.stress_threshold = 7
        self.mood_threshold = 3

        # ---- Campus baselines for radar chart ---------------------------
        self.campus_baseline = self._compute_campus_baselines()

        # ---- Store dataset path for retraining ----------------------------
        self._dataset_path = dataset_path

        logger.info("MLEngine ready. %d students in training set.", len(self.df))

    # ------------------------------------------------------------------
    # Phase 1  –  Data Ingestion & Preprocessing
    # ------------------------------------------------------------------
    @staticmethod
    def _phase1_preprocess(filepath: str) -> pd.DataFrame:
        """Replicate Phase 1 of social_isolation_pipeline.py."""
        df = pd.read_csv(filepath)
        df.rename(columns=COLUMN_MAP, inplace=True)

        # Step 1: CGPA sanitisation (regex)
        def clean_cgpa(value: Any) -> float:
            if pd.isna(value):
                return np.nan
            value_str = str(value).strip()
            match = re.findall(r"(\d+\.?\d*)", value_str)
            if match:
                return min(float(match[0]), 4.0)
            return np.nan

        df["cgpa"] = df["cgpa"].apply(clean_cgpa)

        # Step 2: Contextual imputation by living_status group median
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        for _group_name, group_df in df.groupby("living_status"):
            for col in numeric_cols:
                missing_mask = df.loc[group_df.index, col].isna()
                n_missing = missing_mask.sum()
                if n_missing > 0:
                    group_median = group_df[col].median()
                    df.loc[group_df.index[missing_mask], col] = group_median

        # Step 3: Z-score clip-winsorisation for screen_time & hours_alone
        for col in ["screen_time", "hours_alone_weekly"]:
            if col not in df.columns:
                continue
            col_data = df[col].astype(float)
            mean_val = col_data.mean()
            std_val = col_data.std()
            if std_val == 0:
                continue
            lower_bound = mean_val - 3 * std_val
            upper_bound = mean_val + 3 * std_val
            df[col] = col_data.clip(lower=lower_bound, upper=upper_bound)

        return df

    # ------------------------------------------------------------------
    # Phase 2  –  Feature Engineering (Social Density Score)
    # ------------------------------------------------------------------
    @staticmethod
    def _phase2_feature_engineering(
        df: pd.DataFrame,
    ) -> Tuple[pd.DataFrame, MinMaxScaler, MinMaxScaler]:
        """
        Build Social_Density_Score exactly as in the pipeline:
          SDS = mean(normalised communal cols) / (1 + normalised isolation col)
        Returns the dataframe plus fitted scalers for later single-row use.
        """
        df = df.copy()

        communal_scaler = MinMaxScaler()
        isolation_scaler = MinMaxScaler()

        communal_data = df[COMMUNAL_COLS].values
        isolation_data = df[[ISOLATION_COL]].values

        communal_normalised = communal_scaler.fit_transform(communal_data)
        isolation_normalised = isolation_scaler.fit_transform(isolation_data)

        communal_mean = communal_normalised.mean(axis=1)
        isolation_flat = isolation_normalised.flatten()

        df["Social_Density_Score"] = communal_mean / (1.0 + isolation_flat)

        return df, communal_scaler, isolation_scaler

    # ------------------------------------------------------------------
    # Phase 3  –  Core Unsupervised Modeling
    # ------------------------------------------------------------------
    def _phase3_modeling(
        self, df: pd.DataFrame
    ) -> Tuple[StandardScaler, KMeans, IsolationForest, float]:
        """Fit StandardScaler, KMeans, and IsolationForest on the dataset."""
        features = [f for f in MODELING_FEATURES if f in df.columns]
        X = df[features].values.astype(float)

        # Fill any remaining NaNs with column median
        for i in range(X.shape[1]):
            col_median = np.nanmedian(X[:, i])
            nan_mask = np.isnan(X[:, i])
            X[nan_mask, i] = col_median

        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)

        # K-Means
        kmeans = KMeans(
            n_clusters=3, random_state=RANDOM_SEED, n_init=10, max_iter=300
        )
        cluster_ids = kmeans.fit_predict(X_scaled)
        df["Cluster_ID"] = cluster_ids

        # Contamination rate from loneliness distribution
        if "loneliness_score" in df.columns:
            high_loneliness = (df["loneliness_score"] >= 4).sum()
            contamination = float(np.clip(high_loneliness / len(df), 0.01, 0.3))
        else:
            contamination = 0.05

        # Isolation Forest
        iso_forest = IsolationForest(
            n_estimators=200,
            contamination=contamination,
            random_state=RANDOM_SEED,
            max_samples="auto",
        )
        preds = iso_forest.fit_predict(X_scaled)
        df["Anomaly_Flag"] = preds
        df["Anomaly_Score"] = iso_forest.decision_function(X_scaled)

        return scaler, kmeans, iso_forest, contamination

    # ------------------------------------------------------------------
    # Phase 3 Extensions: LOF, One-Class SVM, GMM
    # ------------------------------------------------------------------
    def _fit_lof(self) -> np.ndarray:
        """Fit LOF on training data, return reference scores."""
        features = [f for f in MODELING_FEATURES if f in self.df.columns]
        X = self.df[features].values.astype(float)
        for i in range(X.shape[1]):
            col_median = np.nanmedian(X[:, i])
            X[np.isnan(X[:, i]), i] = col_median
        X_scaled = self.standard_scaler.transform(X)

        lof = LocalOutlierFactor(
            n_neighbors=20,
            contamination=self.contamination_rate,
            novelty=False,
        )
        lof.fit_predict(X_scaled)
        return lof.negative_outlier_factor_

    def _fit_ocsvm(self) -> OneClassSVM:
        """Fit One-Class SVM on training data."""
        features = [f for f in MODELING_FEATURES if f in self.df.columns]
        X = self.df[features].values.astype(float)
        for i in range(X.shape[1]):
            col_median = np.nanmedian(X[:, i])
            X[np.isnan(X[:, i]), i] = col_median
        X_scaled = self.standard_scaler.transform(X)

        ocsvm = OneClassSVM(
            nu=self.contamination_rate,
            kernel="rbf",
            gamma="scale",
        )
        ocsvm.fit(X_scaled)
        return ocsvm

    def _fit_gmm(self):
        """Fit GMM on training data and identify At-Risk component."""
        features = [f for f in MODELING_FEATURES if f in self.df.columns]
        X = self.df[features].values.astype(float)
        for i in range(X.shape[1]):
            col_median = np.nanmedian(X[:, i])
            X[np.isnan(X[:, i]), i] = col_median
        X_scaled = self.standard_scaler.transform(X)

        gmm = GaussianMixture(
            n_components=3, covariance_type="full", random_state=RANDOM_SEED
        )
        gmm.fit(X_scaled)

        # Determine at-risk component (lowest average SDS)
        gmm_labels = gmm.predict(X_scaled)
        cluster_sds = {}
        for cid in range(3):
            mask = gmm_labels == cid
            if mask.sum() > 0:
                cluster_sds[cid] = self.df.loc[mask, "Social_Density_Score"].mean()
            else:
                cluster_sds[cid] = 0.0
        at_risk_component = min(cluster_sds, key=cluster_sds.get)
        return gmm, at_risk_component

    # ------------------------------------------------------------------
    # Phase 4 helper  –  cluster-label mapping from centroids
    # ------------------------------------------------------------------
    def _derive_cluster_label_map(self) -> Dict[int, str]:
        """
        Assign semantic labels to KMeans clusters using centroid
        Social_Density_Score (same logic as pipeline Phase 3
        ``_assign_cluster_labels``).
        """
        features = [f for f in MODELING_FEATURES if f in self.df.columns]
        sds_idx = features.index("Social_Density_Score")

        centroids = self.kmeans.cluster_centers_
        profiles = {
            i: {"social_density": centroids[i][sds_idx]}
            for i in range(len(centroids))
        }

        sorted_clusters = sorted(profiles.items(), key=lambda x: x[1]["social_density"])

        label_map: Dict[int, str] = {}
        label_map[sorted_clusters[0][0]] = "At-Risk"
        label_map[sorted_clusters[1][0]] = "Academically Focused"
        label_map[sorted_clusters[-1][0]] = "Highly Social"

        logger.info("Cluster label map: %s", label_map)
        return label_map

    # ------------------------------------------------------------------
    # Campus baselines (for radar chart)
    # ------------------------------------------------------------------
    def _compute_campus_baselines(self) -> Dict[str, float]:
        """
        Compute campus-wide mean values for the six radar-chart
        dimensions, normalised to a 0-100 scale.
        """
        df = self.df

        def _safe_mean(col: str) -> float:
            if col in df.columns:
                return float(df[col].mean())
            return 0.0

        # Raw means
        sds_mean = _safe_mean("Social_Density_Score")
        study_mean = _safe_mean("daily_self_study_hours")
        screen_mean = _safe_mean("screen_time")
        wellness_mean = _safe_mean("social_wellness_rating")
        sleep_mean = _safe_mean("sleep_hours")
        social_activity_mean = (
            _safe_mean("meals_with_friends")
            + _safe_mean("social_outings")
            + _safe_mean("society_events_attended")
        ) / 3.0

        # Normalise to 0-100
        # SDS is typically in [0, ~0.5] — use dataset max for scaling
        sds_max = max(float(df["Social_Density_Score"].max()), 0.01)
        study_max = max(float(df["daily_self_study_hours"].max()), 0.01)
        screen_max = max(float(df["screen_time"].max()), 0.01)
        sleep_max = max(float(df["sleep_hours"].max()), 0.01)
        social_act_max = max(
            (
                float(df["meals_with_friends"].max())
                + float(df["social_outings"].max())
                + float(df["society_events_attended"].max())
            )
            / 3.0,
            0.01,
        )

        return {
            "Social Density": round(min((sds_mean / sds_max) * 100, 100), 1),
            "Academic Focus": round(min((study_mean / study_max) * 100, 100), 1),
            "Screen Time": round(min((screen_mean / screen_max) * 100, 100), 1),
            "Wellbeing": round(min((wellness_mean / 5.0) * 100, 100), 1),
            "Sleep Quality": round(min((sleep_mean / sleep_max) * 100, 100), 1),
            "Social Activity": round(
                min((social_activity_mean / social_act_max) * 100, 100), 1
            ),
        }

    # ------------------------------------------------------------------
    # Single-student inference
    # ------------------------------------------------------------------
    def predict(self, input_data: AssessmentInput) -> PredictionResponse:
        """
        Run the full inference pipeline for a single student.

        Steps mirror Phases 2-4 of the original pipeline but operate on
        a single feature vector rather than the whole dataset.
        """
        data = input_data.model_dump()

        # 1. Compute Social Density Score for this student ----------------
        communal_vals = np.array(
            [[data[c] for c in COMMUNAL_COLS]], dtype=float
        )
        isolation_vals = np.array([[data[ISOLATION_COL]]], dtype=float)

        communal_norm = self.communal_scaler.transform(communal_vals)
        isolation_norm = self.isolation_scaler.transform(isolation_vals)

        communal_mean = float(communal_norm.mean(axis=1)[0])
        isolation_flat = float(isolation_norm.flatten()[0])
        sds = communal_mean / (1.0 + isolation_flat)
        data["Social_Density_Score"] = sds

        # 2. Build feature vector in MODELING_FEATURES order --------------
        feature_vector = np.array(
            [[data.get(f, 0.0) for f in MODELING_FEATURES]], dtype=float
        )

        # 3. Scale --------------------------------------------------------
        X_scaled = self.standard_scaler.transform(feature_vector)

        # 4. Cluster prediction -------------------------------------------
        cluster_id = int(self.kmeans.predict(X_scaled)[0])
        cluster_label = self.cluster_label_map.get(cluster_id, "Unknown")

        # 5. Anomaly detection --------------------------------------------
        anomaly_pred = int(self.isolation_forest.predict(X_scaled)[0])
        anomaly_score = float(self.isolation_forest.decision_function(X_scaled)[0])
        is_anomaly = anomaly_pred == -1

        # 6. False-positive filter (Phase 4 logic) ------------------------
        risk_category = self._apply_false_positive_filter(
            data, sds, is_anomaly, cluster_label
        )

        # 7. Recommendation -----------------------------------------------
        recommendation = self._get_recommendation(risk_category, data)

        # 8. User scores for radar chart ----------------------------------
        user_scores = self._compute_user_scores(data)

        # 9. Health highlights (positive indicators) ----------------------
        health_highlights = self._compute_health_highlights(data, risk_category)

        # 10. Ensemble scoring (LOF + OCSVM + IF) -------------------------
        if_vote = 1 if is_anomaly else 0

        # LOF: use novelty=False reference; approximate with OCSVM
        lof_novelty = LocalOutlierFactor(n_neighbors=20, novelty=True, contamination=self.contamination_rate)
        features_list = [f for f in MODELING_FEATURES if f in self.df.columns]
        X_train = self.df[features_list].values.astype(float)
        for i in range(X_train.shape[1]):
            col_median = np.nanmedian(X_train[:, i])
            X_train[np.isnan(X_train[:, i]), i] = col_median
        X_train_scaled = self.standard_scaler.transform(X_train)
        lof_novelty.fit(X_train_scaled)
        lof_pred = int(lof_novelty.predict(X_scaled)[0])
        lof_score = float(lof_novelty.score_samples(X_scaled)[0])
        lof_vote = 1 if lof_pred == -1 else 0

        ocsvm_pred = int(self.ocsvm.predict(X_scaled)[0])
        ocsvm_vote = 1 if ocsvm_pred == -1 else 0

        total_votes = if_vote + lof_vote + ocsvm_vote
        ensemble_flag = 1 if total_votes >= 2 else 0
        ensemble_agreement = round((total_votes / 3.0) * 100, 1)

        # GMM probability
        gmm_probas = self.gmm.predict_proba(X_scaled)[0]
        gmm_proba_atrisk = float(gmm_probas[self.gmm_at_risk_component])

        # 11. Build response ----------------------------------------------
        from privacy import generate_session_id

        return PredictionResponse(
            user_id=generate_session_id(),
            social_density_score=round(sds, 4),
            cluster_label=cluster_label,
            risk_category=risk_category,
            anomaly_score=round(anomaly_score, 4),
            recommendation=recommendation,
            user_scores=user_scores,
            campus_baseline=self.campus_baseline,
            health_highlights=health_highlights,
            ensemble_flag=ensemble_flag,
            lof_score=round(lof_score, 4),
            gmm_proba_atrisk=round(gmm_proba_atrisk, 4),
            ensemble_agreement=ensemble_agreement,
            total_assessments=len(self.df),
        )

    # ------------------------------------------------------------------
    # Phase 4 false-positive filter (single student)
    # ------------------------------------------------------------------
    def _apply_false_positive_filter(
        self,
        data: Dict[str, Any],
        sds: float,
        is_anomaly: bool,
        cluster_label: str,
    ) -> str:
        """
        Replicate the false-positive filter from Phase 4 for a single
        student.

        Priority order:
          1. Healthy override (high friends/lunches/outings) → 'Highly Social'
          2. High-academic exception → 'Academically Focused Overachiever'
          3. Genuine isolation confirmation → 'Confirmed At-Risk'
          4. Remaining anomalies → 'Monitor'
          5. Non-anomalies keep their cluster label.
        """
        # 1. Healthy override: explicitly requested by user
        # If they have enough friends, regular lunches, and outings, they are healthy.
        if (
            data.get("friend_group_size", 0) >= 3
            and data.get("meals_with_friends", 0) >= 2
            and data.get("social_outings", 0) >= 1
        ):
            return "Highly Social"

        if not is_anomaly:
            return cluster_label

        low_social = sds < self.social_density_median

        # Exception filter: high-performing introvert
        if (
            low_social
            and data.get("daily_self_study_hours", 0) >= self.study_75th
            and data.get("cgpa", 0) >= self.cgpa_threshold
            and data.get("class_attendance", 0) >= self.attendance_threshold
        ):
            return "Academically Focused Overachiever"

        # Genuine isolation: low social + high screen + high stress + low mood
        if (
            low_social
            and data.get("screen_time", 0) >= self.screen_time_75th
            and data.get("workload_stress", 0) >= self.stress_threshold
            and data.get("mood_rating", 10) <= self.mood_threshold
        ):
            return "Confirmed At-Risk"

        # Remaining anomaly that doesn't meet strict criteria
        return "Monitor"

    # ------------------------------------------------------------------
    # Recommendations
    # ------------------------------------------------------------------
    @staticmethod
    def _get_recommendation(category: str, data: Dict[str, Any] = None) -> RecommendationPayload:
        """Return a context-appropriate recommendation payload."""
        if category == "Confirmed At-Risk":
            return RecommendationPayload(
                status="warning",
                title="We're Here For You",
                message=(
                    "Your profile suggests you may be experiencing social isolation. "
                    "This is more common than you think, and small steps can help. "
                    "Try connecting with a campus volunteer for a casual chai, or "
                    "visit the university counseling center — it's free and confidential. "
                    "You don't have to go through this alone."
                ),
            )
        if category == "At-Risk":
            return RecommendationPayload(
                status="warning",
                title="Let's Reconnect",
                message=(
                    "Your social-engagement signals are below the campus average. "
                    "Consider starting with one small step this week — invite a "
                    "classmate for lunch, study in a shared space, or attend a "
                    "low-key campus event. Even a 10-minute coffee chat can shift "
                    "your week for the better!"
                ),
            )
        if category == "Monitor":
            return RecommendationPayload(
                status="info",
                title="Soft Check-In",
                message=(
                    "You're doing okay, but a few of your social indicators are "
                    "slightly below average. It's nothing urgent — just a nudge to "
                    "keep your social routines active. Try eating one more meal with "
                    "friends this week or visiting the common room between classes."
                ),
            )
        if category in ("Academically Focused Overachiever", "Academically Focused"):
            return RecommendationPayload(
                status="info",
                title="Academic Powerhouse",
                message=(
                    "You're crushing it academically — your CGPA and study habits are "
                    "excellent! Just make sure to balance the grind with some social "
                    "downtime. A library study-group session could combine productivity "
                    "with connection."
                ),
            )
        # "Highly Social" or anything else — enriched healthy message
        # Build a personalised positive message based on their actual data
        positives = []
        if data:
            if data.get("friend_group_size", 0) >= 3:
                positives.append(f"a solid friend group of {int(data['friend_group_size'])}")
            if data.get("meals_with_friends", 0) >= 2:
                positives.append(f"{int(data['meals_with_friends'])} meals with friends per week")
            if data.get("social_outings", 0) >= 1:
                positives.append(f"{int(data['social_outings'])} social outing(s) this week")
            if data.get("society_memberships", 0) >= 1:
                positives.append(f"{int(data['society_memberships'])} active society membership(s)")

        if positives:
            detail = ", ".join(positives[:-1]) + (f" and {positives[-1]}" if len(positives) > 1 else positives[0])
            extra = f" You've got {detail} — that's exactly the kind of engagement that keeps campus life vibrant."
        else:
            extra = ""

        return RecommendationPayload(
            status="success",
            title="You're Doing Great! 🎉",
            message=(
                "Excellent news — your social-academic balance is healthy and your "
                "engagement across campus activities is strong." + extra +
                " Keep up these routines and consider mentoring someone who could "
                "use a friendly face."
            ),
        )

    # ------------------------------------------------------------------
    # Health highlights (positive indicators)
    # ------------------------------------------------------------------
    @staticmethod
    def _compute_health_highlights(
        data: Dict[str, Any], category: str
    ) -> List[str]:
        """
        Return a list of positive indicators explaining why the student
        is socially healthy. Used for the UI to show 'why you're doing well'.
        Returns an empty list for at-risk categories.
        """
        highlights: List[str] = []

        friends = data.get("friend_group_size", 0)
        meals = data.get("meals_with_friends", 0)
        outings = data.get("social_outings", 0)
        societies = data.get("society_memberships", 0)
        events = data.get("society_events_attended", 0)
        common_room = data.get("common_room_frequency", 0)
        sleep = data.get("sleep_hours", 0)
        mood = data.get("mood_rating", 0)
        cgpa = data.get("cgpa", 0)
        loneliness = data.get("loneliness_score", 5)
        peer_sat = data.get("peer_satisfaction", 0)

        # Friend group
        if friends >= 5:
            highlights.append(f"Strong friend group ({int(friends)} friends)")
        elif friends >= 3:
            highlights.append(f"Healthy friend circle ({int(friends)} friends)")

        # Meals
        if meals >= 5:
            highlights.append(f"Very social diner ({int(meals)} meals/week with friends)")
        elif meals >= 2:
            highlights.append(f"Regular shared meals ({int(meals)}/week)")

        # Outings
        if outings >= 2:
            highlights.append(f"Active social life ({int(outings)} outings/week)")
        elif outings >= 1:
            highlights.append("Gets out for social activities")

        # Societies
        if societies >= 2:
            highlights.append(f"Active in {int(societies)} societies")
        elif societies >= 1:
            highlights.append("Society member")

        # Events
        if events >= 4:
            highlights.append(f"Attended {int(events)} events this semester")

        # Common room
        if common_room >= 4:
            highlights.append("Frequent common room visitor")

        # Sleep
        if sleep >= 7:
            highlights.append(f"Healthy sleep ({sleep:.0f} hrs/night)")

        # Mood
        if mood >= 7:
            highlights.append(f"Positive mood ({int(mood)}/10)")

        # CGPA
        if cgpa >= 3.5:
            highlights.append(f"High achiever (CGPA {cgpa:.2f})")
        elif cgpa >= 3.0:
            highlights.append(f"Solid academics (CGPA {cgpa:.2f})")

        # Low loneliness
        if loneliness <= 2:
            highlights.append("Low loneliness — feels connected")

        # Peer satisfaction
        if peer_sat >= 7:
            highlights.append(f"Satisfied with peer interactions ({int(peer_sat)}/10)")

        return highlights

    # ------------------------------------------------------------------
    # Radar-chart scores (single student)
    # ------------------------------------------------------------------
    def _compute_user_scores(self, data: Dict[str, Any]) -> Dict[str, float]:
        """
        Normalise the student's key metrics to 0-100 for radar-chart
        display, using the same maxima that were used for the campus
        baselines.
        """
        df = self.df

        sds = data.get("Social_Density_Score", 0.0)
        study = data.get("daily_self_study_hours", 0.0)
        screen = data.get("screen_time", 0.0)
        wellness = data.get("social_wellness_rating", 0.0)
        sleep = data.get("sleep_hours", 0.0)
        social_act = (
            data.get("meals_with_friends", 0.0)
            + data.get("social_outings", 0.0)
            + data.get("society_events_attended", 0.0)
        ) / 3.0

        sds_max = max(float(df["Social_Density_Score"].max()), 0.01)
        study_max = max(float(df["daily_self_study_hours"].max()), 0.01)
        screen_max = max(float(df["screen_time"].max()), 0.01)
        sleep_max = max(float(df["sleep_hours"].max()), 0.01)
        social_act_max = max(
            (
                float(df["meals_with_friends"].max())
                + float(df["social_outings"].max())
                + float(df["society_events_attended"].max())
            )
            / 3.0,
            0.01,
        )

        return {
            "Social Density": round(min((sds / sds_max) * 100, 100), 1),
            "Academic Focus": round(min((study / study_max) * 100, 100), 1),
            "Screen Time": round(min((screen / screen_max) * 100, 100), 1),
            "Wellbeing": round(min((wellness / 5.0) * 100, 100), 1),
            "Sleep Quality": round(min((sleep / sleep_max) * 100, 100), 1),
            "Social Activity": round(
                min((social_act / social_act_max) * 100, 100), 1
            ),
        }

    # ------------------------------------------------------------------
    # Dataset statistics (for frontend)
    # ------------------------------------------------------------------
    def get_stats(self) -> Dict[str, Any]:
        """Return dataset-wide statistics for the frontend."""
        df = self.df
        total = len(df)

        # Risk distribution
        risk_dist = {}
        if "Final_Risk_Category" in df.columns:
            for cat, cnt in df["Final_Risk_Category"].value_counts().items():
                risk_dist[cat] = {"count": int(cnt), "pct": round(cnt / total * 100, 1)}

        # Cluster distribution
        cluster_dist = {}
        if "Cluster_Label" in df.columns:
            for label, cnt in df["Cluster_Label"].value_counts().items():
                cluster_dist[label] = {"count": int(cnt), "pct": round(cnt / total * 100, 1)}

        return {
            "total_students": total,
            "avg_sds": round(float(df["Social_Density_Score"].mean()), 4) if "Social_Density_Score" in df.columns else 0,
            "avg_cgpa": round(float(df["cgpa"].mean()), 2) if "cgpa" in df.columns else 0,
            "avg_loneliness": round(float(df["loneliness_score"].mean()), 2) if "loneliness_score" in df.columns else 0,
            "avg_screen_time": round(float(df["screen_time"].mean()), 1) if "screen_time" in df.columns else 0,
            "avg_sleep": round(float(df["sleep_hours"].mean()), 1) if "sleep_hours" in df.columns else 0,
            "risk_distribution": risk_dist,
            "cluster_distribution": cluster_dist,
        }

    # ------------------------------------------------------------------
    # Retrain (reload dataset and refit all models)
    # ------------------------------------------------------------------
    def retrain(self, dataset_path: Optional[str] = None) -> None:
        """Reload the dataset and refit all models. Used after appending new data."""
        path = dataset_path or self._dataset_path
        logger.info("Retraining MLEngine from %s", path)
        self.__init__(path)
