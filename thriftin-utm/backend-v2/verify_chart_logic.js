// Emulate frontend logic
const pad = (n) => String(n).padStart(2, "0");
const parseDate = (d) => new Date(d);
const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();
const isSameMonth = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

// Mock Data (Simulate what backend sends)
const activities = [
    { date: new Date().toISOString(), sessions: 1 }, // Today
    { date: new Date(new Date().setHours(new Date().getHours() - 1)).toISOString(), sessions: 1 }, // Today, 1 hour ago
    { date: "2026-01-08T10:00:00", sessions: 2 }, // Yesterday (assuming today is 2026-01-09)
    { date: "2026-01-01T09:00:00", sessions: 5 }, // Earlier this month
    { date: "2025-12-25T08:00:00", sessions: 3 }, // Last month
];

const now = new Date("2026-01-09T12:00:00"); // Simulate Today as per user context

// --- Aggregate Logic Emulator ---
function aggregate(filteredActivities, mode) {
    let counts = [];
    if (mode === 'today') {
        counts = Array(24).fill(0);
        filteredActivities.forEach(a => {
            counts[parseDate(a.date).getHours()] += a.sessions;
        });
    } else if (mode === 'thisMonth') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        counts = Array(daysInMonth).fill(0);
        filteredActivities.forEach(a => {
            counts[parseDate(a.date).getDate() - 1] += a.sessions;
        });
    }
    return counts;
}

// Test Today
const todaySubset = activities.filter(a => isSameDay(parseDate(a.date), now)); // NOTE: In real code 'now' is `new Date()`
console.log("Today Subset size:", todaySubset.length); // Should be 2 if my mock dates match 'now'
// My mock dates are dynamic `new Date()`, so they match the REAL run time.
// Let's force mock dates to be static for this test to be robust.

const staticActivities = [
    { date: "2026-01-09T12:00:00", sessions: 1 },
    { date: "2026-01-09T11:00:00", sessions: 1 },
    { date: "2026-01-08T10:00:00", sessions: 2 },
    { date: "2026-01-01T09:00:00", sessions: 5 },
];
const staticNow = new Date("2026-01-09T13:00:00");

// 1. Filter Today
const subsetToday = staticActivities.filter(a => isSameDay(parseDate(a.date), staticNow));
const aggToday = aggregate(subsetToday, 'today');
console.log("Hourly (Today) Counts:", JSON.stringify(aggToday));
// Expect: index 12 has 1, index 11 has 1.

// 2. Filter Month
const subsetMonth = staticActivities.filter(a => isSameMonth(parseDate(a.date), staticNow));
const aggMonth = aggregate(subsetMonth, 'thisMonth');
console.log("Daily (Month) Counts:", JSON.stringify(aggMonth));
// Expect: index 0 (Day 1) has 5, index 7 (Day 8) has 2, index 8 (Day 9) has 2.
