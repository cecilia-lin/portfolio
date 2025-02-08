import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";


const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

let selectedIndex = -1;
let query = '';

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
    let svg = d3.select('svg');

    let newArcs = newArcData.map((d) => arcGenerator(d));


    newArcs.forEach((arc, idx) => {
        svg.append('path')
          .attr('d', arc)
          .attr('fill', colors(idx)) 
          .on('click', () => {
            selectedIndex = selectedIndex === idx ? -1 : idx;
            
            
            updateSelectionState(data);
            filterProjects();
          });
    });

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
                filterProjects();
            });
    });

    updateSelectionState(data);

}

  function updateSelectionState(data) {
    d3.selectAll('path')
        .attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : null));

    d3.selectAll('.legend li')
        .attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : null));
}

  function filterProjects() {

    let filteredProjects = projects;
    
    //apply search 
    if (query.length > 0) {
        filteredProjects = filteredProjects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
        });
    }
    
    //apply pie chart filter 
    if (selectedIndex !== -1) {
        let data = d3.rollups(projects, (v) => v.length, (d) => d.year)
                     .map(([year, count]) => ({ value: count, label: year }));

        let selectedYear = data[selectedIndex]?.label;
        filteredProjects = filteredProjects.filter(project => project.year == selectedYear);
    }

    renderProjects(filteredProjects, projectsContainer, 'h2');
}

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('input', (event) => {
    query = event.target.value;
    filterProjects(); 
});
