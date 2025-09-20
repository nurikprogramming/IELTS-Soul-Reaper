/* ============================
   mission.js
   Author: Osaragi (20+ yrs exp)
   Purpose: Handle missions logic
   ============================ */

/**
 * MissionManager
 * Handles mission state, rendering, and persistence
 */
class MissionManager {
    constructor(storageKey = "soulReaperMissions") {
        this.storageKey = storageKey;
        this.missions = this.loadMissions();
        this.missionContainer = document.getElementById("missions");
        this.progressBar = document.getElementById("mission-progress");
        this.progressText = document.getElementById("progress-text");
        this.rewardManager = new RewardManager(); // assume reward.js exists
        this.renderMissions();
        this.updateProgress();
    }

    /**
     * Loads missions from localStorage or sets defaults
     */
    loadMissions() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        }
        // default missions for first-time user
        return [
            { id: 1, title: "Defeat Captain Listening", desc: "Complete 1 Listening test", completed: false },
            { id: 2, title: "Defeat Captain Reading", desc: "Read 1 passage under 20 min", completed: false },
            { id: 3, title: "Defeat Captain Writing", desc: "Write 1 Task 2 essay", completed: false },
            { id: 4, title: "Defeat Captain Speaking", desc: "Record yourself answering Part 2", completed: false },
            { id: 5, title: "Defeat Captain Grammar", desc: "Master 10 conditionals", completed: false }
        ];
    }

    /**
     * Save missions to localStorage
     */
    saveMissions() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.missions));
    }

    /**
     * Renders missions into DOM
     */
    renderMissions() {
        if (!this.missionContainer) return;
        this.missionContainer.innerHTML = ""; // clear old

        this.missions.forEach(mission => {
            const missionEl = document.createElement("div");
            missionEl.className = `mission ${mission.completed ? "completed" : ""}`;

            missionEl.innerHTML = `
                <h3>${mission.title}</h3>
                <p>${mission.desc}</p>
                <button class="mission-btn" data-id="${mission.id}">
                    ${mission.completed ? "✔ Completed" : "Mark Complete"}
                </button>
            `;

            this.missionContainer.appendChild(missionEl);
        });

        // attach button listeners
        this.attachListeners();
    }

    /**
     * Add new mission dynamically
     */
    addMission(title, desc) {
        const newMission = {
            id: Date.now(),
            title,
            desc,
            completed: false
        };
        this.missions.push(newMission);
        this.saveMissions();
        this.renderMissions();
        this.updateProgress();
    }

    /**
     * Mark mission complete and trigger reward
     */
    completeMission(id) {
        const mission = this.missions.find(m => m.id === id);
        if (mission && !mission.completed) {
            mission.completed = true;
            this.rewardManager.unlockRandomReward();
            this.saveMissions();
            this.renderMissions();
            this.updateProgress();
        }
    }

    /**
     * Attaches click listeners to mission buttons
     */
    attachListeners() {
        const buttons = document.querySelectorAll(".mission-btn");
        buttons.forEach(btn => {
            btn.addEventListener("click", () => {
                const id = parseInt(btn.getAttribute("data-id"), 10);
                this.completeMission(id);
            });
        });
    }

    /**
     * Updates mission progress bar
     */
    updateProgress() {
        const total = this.missions.length;
        const done = this.missions.filter(m => m.completed).length;
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;

        if (this.progressBar) {
            this.progressBar.style.width = percent + "%";
        }
        if (this.progressText) {
            this.progressText.textContent = `${done}/${total} Missions Complete (${percent}%)`;
        }
    }
}

/* ============================
   RewardManager Stub
   ============================ */
class RewardManager {
    constructor() {
        this.rewards = [
            "Unlocked a hidden Zanpakutō ability",
            "Discovered a new training scroll",
            "Aizen whispers: 'You are closer to 7.5...'",
            "Unlocked secret dark theme",
            "Boost: +10% efficiency next session"
        ];
        this.rewardContainer = document.getElementById("rewards");
    }

    unlockRandomReward() {
        const reward = this.rewards[Math.floor(Math.random() * this.rewards.length)];
        if (this.rewardContainer) {
            const rewardEl = document.createElement("div");
            rewardEl.className = "reward unlocked";
            rewardEl.textContent = reward;
            this.rewardContainer.appendChild(rewardEl);
        }
        console.log("Reward unlocked:", reward);
    }
}

/* ============================
   Init on DOM Load
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
    window.missionManager = new MissionManager();
});
