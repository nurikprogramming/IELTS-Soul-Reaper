/* ============================
   rewards.js
   Author: Osaragi (20+ yrs exp)
   Purpose: Manage rewards system
   ============================ */

/**
 * RewardManager
 * Handles reward logic, rarity tiers, persistence
 */
class RewardManager {
    constructor(storageKey = "soulReaperRewards") {
        this.storageKey = storageKey;
        this.rewards = this.loadRewards();
        this.rewardContainer = document.getElementById("rewards");

        // Rarity system
        this.rewardPool = {
            common: [
                "Motivation boost: +5% focus",
                "Aizen smirks: 'You're on the right path'",
                "Unlocked 1 random Kanji word",
                "Minor stamina recovery potion"
            ],
            rare: [
                "Unlocked Captain's hidden technique",
                "Shadow training unlocked (double XP for 1 hour)",
                "Secret passage discovered in Seireitei",
                "Spirit core boost: +15% progress"
            ],
            epic: [
                "Zanpakutō Awakening (new ability discovered)",
                "Unlocked hidden Bleach soundtrack track",
                "Hallucination vision of final battle",
                "Aizen whispers forbidden knowledge"
            ],
            legendary: [
                "Final Form: +30% boost until next mission",
                "Immortalized in Soul Reaper Records",
                "Secret dialogue unlocked with Aizen",
                "Reality bends: you see beyond 7.5"
            ]
        };

        this.renderRewards();
    }

    /**
     * Load stored rewards
     */
    loadRewards() {
        const stored = localStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : [];
    }

    /**
     * Save rewards
     */
    saveRewards() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.rewards));
    }

    /**
     * Unlock reward based on rarity distribution
     */
    unlockRandomReward() {
        const rarity = this.getRandomRarity();
        const pool = this.rewardPool[rarity];
        const reward = pool[Math.floor(Math.random() * pool.length)];

        const unlocked = { text: reward, rarity, time: Date.now() };
        this.rewards.push(unlocked);
        this.saveRewards();

        this.renderSingleReward(unlocked);
        this.animateReward(unlocked);

        console.log(`Unlocked ${rarity.toUpperCase()} reward: ${reward}`);
    }

    /**
     * Weighted rarity system
     */
    getRandomRarity() {
        const roll = Math.random() * 100;
        if (roll < 60) return "common";   // 60%
        if (roll < 85) return "rare";     // 25%
        if (roll < 97) return "epic";     // 12%
        return "legendary";               // 3%
    }

    /**
     * Render all rewards
     */
    renderRewards() {
        if (!this.rewardContainer) return;
        this.rewardContainer.innerHTML = "";

        this.rewards.forEach(r => this.renderSingleReward(r));
    }

    /**
     * Render a single reward
     */
    renderSingleReward(reward) {
        if (!this.rewardContainer) return;

        const rewardEl = document.createElement("div");
        rewardEl.className = `reward-card ${reward.rarity}`;
        rewardEl.innerHTML = `
            <span class="reward-text">${reward.text}</span>
            <small class="reward-meta">${reward.rarity.toUpperCase()} • ${new Date(reward.time).toLocaleString()}</small>
        `;
        this.rewardContainer.appendChild(rewardEl);
    }

    /**
     * Add visual animation when reward unlocks
     */
    animateReward(reward) {
        if (!this.rewardContainer) return;
        const lastReward = this.rewardContainer.lastElementChild;
        if (!lastReward) return;

        lastReward.classList.add("reward-animate");

        // Remove animation after 3s to allow re-triggers
        setTimeout(() => {
            lastReward.classList.remove("reward-animate");
        }, 3000);
    }

    /**
     * Manually add reward (custom events, future extensions)
     */
    addReward(text, rarity = "common") {
        const reward = { text, rarity, time: Date.now() };
        this.rewards.push(reward);
        this.saveRewards();
        this.renderSingleReward(reward);
        this.animateReward(reward);
    }
}

/* ============================
   Init on DOM Load
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
    window.rewardManager = new RewardManager();
});
