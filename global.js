console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a")

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );

// currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/cecilia-lin', title: 'Profile' },
    { url: 'meta/', title: 'Meta' },
    { url: 'contact/', title: 'Contact' },
  ];

  const ARE_WE_HOME = document.documentElement.classList.contains('home');


let nav = document.createElement('nav');
document.body.prepend(nav);


for (let p of pages) {
    let url = p.url;
    let title = p.title;
    // TODO create link and add it to nav
    url = !ARE_WE_HOME && !url.startsWith('http') ? '../' + url : url;

    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a); 

    
      a.classList.toggle(
        'current',
        a.host === location.host && a.pathname === location.pathname
      );

      if (a.host !== location.host) {
        a.target = "_blank";
      }
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select id="theme-selector">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );
  
const select = document.querySelector('.color-scheme select');

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);
  });

select.addEventListener('input', function (event) {
    const selectedScheme = event.target.value;
  
    localStorage.colorScheme = selectedScheme;
  
    setColorScheme(selectedScheme);
  });

if ("colorScheme" in localStorage) {
    const savedScheme = localStorage.colorScheme;
    setColorScheme(savedScheme);
    select.value = savedScheme; 
  }

  function setColorScheme(colorScheme) {
    document.documentElement.style.setProperty('color-scheme', colorScheme);
  }
  
  export async function fetchJSON(url) {
    try {
        // Fetch the JSON file from the given URL
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }
      const data = await response.json();
      return data; 
      
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
  // Your code will go here
  containerElement.innerHTML = '';

  const projectsTitle = document.querySelector('.projects-title');

  if (projectsTitle) {
    projectsTitle.innerHTML = `${project.length} Projects`;
  }

  if (!containerElement){
    console.error("Invalid container element");
    return;
  }
  
  const HeadingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    if (!HeadingLevels.includes(headingLevel)) {
        console.error("Invalid heading level:");
        return;
    }
  
  project.forEach(project => {
    const article = document.createElement('article');

    article.innerHTML = `
    <h3>${project.title}</h3>
    <img src="${project.image}" alt="${project.title}">
    <div>
    <p> ${project.year}</p> 
    <p>${project.description}</p>
    </div>
    `;

    containerElement.appendChild(article);

  });

}

  export async function fetchGithubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}


~