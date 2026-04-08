// .github/scripts/generate-stats.mjs
import { writeFileSync, readFileSync } from 'fs';

const USERNAME = 'Zy0x';
const TOKEN = process.env.GH_STATS_TOKEN;

const headers = {
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function ghFetch(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${url}`);
  return res.json();
}

async function ghGraphQL(query) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL error: ${res.status}`);
  return res.json();
}

async function getStats() {
  // Data user dasar
  const user = await ghFetch(`https://api.github.com/users/${USERNAME}`);

  // Semua repo untuk hitung total stars
  let page = 1, totalStars = 0, repos = [];
  while (true) {
    const batch = await ghFetch(
      `https://api.github.com/users/${USERNAME}/repos?per_page=100&page=${page}`
    );
    if (!batch.length) break;
    repos.push(...batch);
    totalStars += batch.reduce((sum, r) => sum + r.stargazers_count, 0);
    page++;
  }

  // Contributions via GraphQL (lebih akurat)
  const gql = await ghGraphQL(`{
    user(login: "${USERNAME}") {
      contributionsCollection {
        totalCommitContributions
        totalPullRequestContributions
        totalIssueContributions
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }`);

  const contrib = gql.data.user.contributionsCollection;

  // Hitung streak
  const allDays = contrib.contributionCalendar.weeks
    .flatMap(w => w.contributionDays)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let currentStreak = 0, longestStreak = 0, tempStreak = 0;
  let countingCurrent = true;

  for (const day of allDays) {
    if (day.contributionCount > 0) {
      tempStreak++;
      if (countingCurrent) currentStreak = tempStreak;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      countingCurrent = false;
      tempStreak = 0;
    }
  }

  // Top languages dari repos
  const langMap = {};
  for (const repo of repos.slice(0, 30)) {
    if (repo.language) {
      langMap[repo.language] = (langMap[repo.language] || 0) + 1;
    }
  }
  const topLangs = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    username: USERNAME,
    name: user.name || USERNAME,
    followers: user.followers,
    publicRepos: user.public_repos,
    totalStars,
    commits: contrib.totalCommitContributions,
    prs: contrib.totalPullRequestContributions,
    issues: contrib.totalIssueContributions,
    totalContributions: contrib.contributionCalendar.totalContributions,
    currentStreak,
    longestStreak,
    topLangs,
    updatedAt: new Date().toISOString().split('T')[0],
  };
}

async function main() {
  console.log('Fetching GitHub stats...');
  const stats = await getStats();

  const langTotal = stats.topLangs.reduce((s, [, v]) => s + v, 0);
  const langBadges = stats.topLangs
    .map(([lang, count]) => {
      const pct = Math.round((count / langTotal) * 100);
      return `![${lang}](https://img.shields.io/badge/${encodeURIComponent(lang)}-${pct}%25-0e75b6?style=flat-square)`;
    })
    .join(' ');

  const statsSection = `<!-- STATS:START -->
<div align="center">

## 📊 GitHub Stats

| Metric | Value |
|--------|-------|
| 🔥 Total Commits (this year) | **${stats.commits.toLocaleString()}** |
| ⭐ Stars Earned | **${stats.totalStars.toLocaleString()}** |
| 📁 Public Repos | **${stats.publicRepos}** |
| 🔀 Pull Requests | **${stats.prs.toLocaleString()}** |
| 🐛 Issues Opened | **${stats.issues.toLocaleString()}** |
| 👥 Followers | **${stats.followers}** |

### 🔁 Contribution Streak

| Current Streak | Longest Streak | Total Contributions |
|:--------------:|:--------------:|:-------------------:|
| **${stats.currentStreak} days** | **${stats.longestStreak} days** | **${stats.totalContributions.toLocaleString()}** |

### 🧑‍💻 Top Languages

${langBadges}

</div>

> _Auto-updated: ${stats.updatedAt} via GitHub Actions_
<!-- STATS:END -->`;

  // Baca README, replace section
  let readme = readFileSync('README.md', 'utf-8');

  if (readme.includes('<!-- STATS:START -->')) {
    readme = readme.replace(
      /<!-- STATS:START -->[\s\S]*?<!-- STATS:END -->/,
      statsSection
    );
  } else {
    readme += '\n' + statsSection;
  }

  writeFileSync('README.md', readme, 'utf-8');
  console.log(`Stats updated: ${stats.updatedAt}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});