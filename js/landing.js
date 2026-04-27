const navbar = document.getElementById('navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const revealItems = document.querySelectorAll('.reveal');


window.addEventListener('scroll', () => {
  if (window.scrollY > 40) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  revealOnScroll();
});


menuToggle?.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});


document.addEventListener('click', (e) => {
  const isClickInsideMenu = navLinks.contains(e.target);
  const isClickOnToggle = menuToggle?.contains(e.target);

  if (!isClickInsideMenu && !isClickOnToggle) {
    navLinks.classList.remove('open');
  }
});


navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
  });
});


document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    navLinks.classList.remove('open');
  }
});


function revealOnScroll() {
  const trigger = window.innerHeight - 120;

  revealItems.forEach((item) => {
    const top = item.getBoundingClientRect().top;
    if (top < trigger) item.classList.add('active');
  });
}

const mapFrame = document.getElementById('mapFrame');
const mapWrap = document.querySelector('.map-fallback-wrap');

if (mapFrame && mapWrap) {
  let loaded = false;

  mapFrame.addEventListener('load', () => {
    loaded = true;
    mapWrap.classList.add('is-loaded');
  });

  setTimeout(() => {
    if (!loaded) {
      mapWrap.classList.remove('is-loaded');
    }
  }, 5000);
}
const devName = document.getElementById('developer-name');

  devName.addEventListener('click', function(e) {
    
    const heartCount = 15; 

    for (let i = 0; i < heartCount; i++) {
      createHeart(e.clientX, e.clientY);
    }
  });



  function createHeart(clientX, clientY) {
    const heart = document.createElement('div');
    heart.classList.add('heart-particle');
    
    
    heart.innerText = '❤️'; 

    
    heart.style.left = clientX + 'px';
    heart.style.top = clientY + 'px';

    
    const size = Math.random() * 15 + 10;
    heart.style.fontSize = size + 'px';

    
    const randomX = (Math.random() - 0.5) * 100;
    heart.style.setProperty('--random-x', randomX + 'px');

    
    const duration = Math.random() * 0.4 + 0.8;
    heart.style.animationDuration = duration + 's';

    document.body.appendChild(heart);

    
    setTimeout(() => {
      heart.remove();
    }, duration * 1000);
  }
window.addEventListener('load', revealOnScroll);