// src/utils/animations.js
// Animation utility functions for enhanced UI effects

/**
 * Creates a typing animation effect for text
 * @param {string} text - The text to animate
 * @param {function} setDisplayText - State setter function
 * @param {number} speed - Typing speed in milliseconds
 */
export const typeText = (text, setDisplayText, speed = 30) => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayText(prev => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    
    return () => clearInterval(timer); // Cleanup function
  };
  
  /**
   * Creates a smooth scrolling effect
   * @param {string} elementId - ID of the element to scroll to
   */
  export const smoothScroll = (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };
  
  /**
   * Adds a parallax effect to elements
   * @param {Event} e - Mouse move event
   * @param {string} selector - CSS selector for elements to apply parallax to
   * @param {number} strength - Effect strength (1-10)
   */
  export const parallaxEffect = (e, selector, strength = 3) => {
    const elements = document.querySelectorAll(selector);
    const mouseX = e.clientX / window.innerWidth - 0.5;
    const mouseY = e.clientY / window.innerHeight - 0.5;
    
    elements.forEach(el => {
      const depth = parseFloat(el.getAttribute('data-depth') || 1);
      const moveX = mouseX * strength * depth;
      const moveY = mouseY * strength * depth;
      
      el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
    });
  };
  
  /**
   * Gradually reveals elements as they enter the viewport
   */
  export const setupScrollReveal = () => {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    
    const revealOnScroll = () => {
      for (let i = 0; i < revealElements.length; i++) {
        const windowHeight = window.innerHeight;
        const elementTop = revealElements[i].getBoundingClientRect().top;
        const elementVisible = 150;
        
        if (elementTop < windowHeight - elementVisible) {
          revealElements[i].classList.add('active');
        }
      }
    };
    
    window.addEventListener('scroll', revealOnScroll);
    // Initial check
    revealOnScroll();
  };