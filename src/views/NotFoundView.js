export class NotFoundView {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  render() {
    this.container.innerHTML = `
      <div class="not-found-container">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>Oops! The page you're looking for doesn't exist.</p>
        <a href="#/home" class="btn">Back to Home</a>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .not-found-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 80vh;
        text-align: center;
        padding: 20px;
      }

      .not-found-container h1 {
        font-size: 6rem;
        margin: 0;
        color: #1a73e8;
      }

      .not-found-container h2 {
        font-size: 2rem;
        margin: 10px 0;
        color: #333;
      }

      .not-found-container p {
        font-size: 1.2rem;
        color: #666;
        margin-bottom: 30px;
      }

      .not-found-container .btn {
        display: inline-block;
        padding: 12px 24px;
        background-color: #1a73e8;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        transition: background-color 0.3s;
      }

      .not-found-container .btn:hover {
        background-color: #1557b0;
      }
    `;
    document.head.appendChild(style);
  }

  cleanup() {
    this.container.innerHTML = '';
  }
} 