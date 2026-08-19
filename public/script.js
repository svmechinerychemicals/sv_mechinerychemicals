document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('quote-form');
  const statusNode = document.getElementById('form-status');
  const submitButton = form?.querySelector('button[type="submit"]');
  const revealTargets = document.querySelectorAll('[data-reveal]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmallScreen = window.matchMedia('(max-width: 800px)').matches;

  if (reduceMotion || isSmallScreen || !('IntersectionObserver' in window)) {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealTargets.forEach((element) => observer.observe(element));
  }

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!statusNode || !submitButton) {
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());

    statusNode.textContent = 'Submitting your inquiry...';
    statusNode.dataset.state = '';
    submitButton.disabled = true;

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      let result;

      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const rawText = await response.text();
        const looksLikeMissingApi = rawText.toLowerCase().includes('the page could not be found');
        result = {
          message: looksLikeMissingApi
            ? 'Form API is not deployed yet. Please redeploy Vercel after uploading api/quote.js and vercel.json.'
            : 'Server returned an unexpected response. Please try again.'
        };
      }

      if (!response.ok) {
        throw new Error(result.message || 'Something went wrong.');
      }

      form.reset();
      statusNode.textContent = result.message;
      statusNode.dataset.state = 'success';
    } catch (error) {
      statusNode.textContent = error.message;
      statusNode.dataset.state = 'error';
    } finally {
      submitButton.disabled = false;
    }
  });
});