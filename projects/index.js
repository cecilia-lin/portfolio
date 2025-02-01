import { fetchJSON, renderProjects, fetchGithubData} from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const latestProjects = projects.slice(0, 3);
const projectsContainer = document.querySelector('.projects');

renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGithubData('cecilialin');
const profileStats = document.querySelector('#profile-stats');

if (profileStats) {
    profileStats.innerHTML = `
        <div class="stat-term">Public Repos:</div><div class="stat-value">${githubData.public_repos}</div>
        <div class="stat-term">Public Gists:</div><div class="stat-value">${githubData.public_gists}</div>
        <div class="stat-term">Followers:</div><div class="stat-value">${githubData.followers}</div>
        <div class="stat-term">Following:</div><div class="stat-value">${githubData.following}</div>
    `;
}