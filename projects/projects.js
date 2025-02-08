import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";


const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

let selectedIndex = -1;

// Refactor all plotting into one function
function renderPieChart(projectsGiven) {
    d3.select('svg').selectAll('path').remove();
    d3.select('.legend').html('');

    let newRolledData = d3.rollups(
      projectsGiven,
      (v) => v.length,
      (d) => d.year,
    );
   
    let data = newRolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
  
    let newSliceGenerator = d3.pie().value((d) => d.value);
    let newArcData = newSliceGenerator(data);
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let newArcs = newArcData.map((d) => arcGenerator(d));
    let svg = d3.select('svg')

    newArcs.forEach((arc, idx) => {
        svg.append('path')
          .attr('d', arc)
          .attr('fill', colors(idx)) 
          .on('click', () => {
            selectedIndex = selectedIndex === idx ? -1 : idx;
            
            updateSelectionState(data);
            filterProjectsByYear(data);
          });
    });

    d3.select('svg')
    .selectAll('path')
    .attr('class', (_, idx) => (
        selectedIndex === idx ? 'selected' : null
    ));
    

    let legend = d3.select('.legend');
    data.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`) // set the style attribute while passing in parameters
          .attr('class', 'label')
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
          .style('cursor', 'pointer')
          .on('click', function () {
              selectedIndex = selectedIndex === idx ? -1 : idx;              
            updateSelectionState(data);
            filterProjectsByYear(data);
            });
    });

    legend
        .selectAll('li')
        .attr('class', (_, idx) => (
            selectedIndex === idx ? 'selected' : null
        ));
}
  

  

let query = '';
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();

    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join('\n').toLowerCase();
        return values.includes(query);
    });

    // re-render legends and pie chart when event triggers
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
  });

  function updateSelectionState(data) {
    d3.selectAll('path')
        .attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : null));

    d3.selectAll('.legend li')
        .attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : null));
}

  function filterProjectsByYear(data) {
    if (selectedIndex === -1) {
        renderProjects(projects, projectsContainer, 'h2');
    } else {
        let selectedYear = data[selectedIndex]?.label;

        if (!selectedYear) {
            console.error("Error: Selected year is undefined");
            return;
        }

        let filteredProjects = projects.filter(project => project.year == selectedYear);

        renderProjects(filteredProjects, projectsContainer, 'h2'); 
    }
}
renderPieChart(projects);

