// config.js (or config.ts)

// Use a function to encapsulate and protect the configuration
const getAppConfig = () => {
    // Define your configuration variables here
    //  * IMPORTANT:  Do NOT store sensitive secrets (like API keys) directly in this file.
    //     * Instead, use environment variables (see below).
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:37773'; // Example, with a default
    const timeout = 10000; // Example of a non-sensitive configuration value
  
    //  * For added security, you can freeze the object, but this might prevent easy mocking in tests.
    // return Object.freeze({
    return {
          apiUrl,
          timeout,
          //  * DO NOT include API keys or secrets here.
    };
  };
  
  export default getAppConfig;
  
  /**
   * Security Best Practices Implemented:
   *
   * 1.  Environment Variables:
   * * The API URL is loaded from an environment variable (`process.env.NEXT_PUBLIC_API_URL`).
   * * Environment variables are the most secure way to store configuration, especially sensitive information.
   * * NEXT.js (if you're using it) automatically handles environment variables.  For other environments, you'll need to configure them (e.g., using a `.env` file and a library like `dotenv`, or setting them in your server's environment).
   * * IMPORTANT:  Never commit secrets to your code repository!  Environment variables are kept separate.
   *
   * 2.  Function Encapsulation:
   * * The configuration is defined within a function (`getAppConfig`). This creates a closure, which helps to protect the variables from accidental modification or access from other parts of your code.
   *
   * 3.  Principle of Least Privilege:
   * * Only the configuration values that are absolutely necessary for the application to run are included here.  Avoid adding unnecessary variables.
   *
   * 4.  No Secrets in Code:
   * * The most critical security practice:  This file *does not* contain any API keys, passwords, or other sensitive secrets.  These should *only* be accessed via environment variables, and those variables should be carefully managed and never exposed.
   *
   * 5.  Default Values:
   * * The API URL includes a default value.  This prevents the application from crashing if the environment variable is not set.  It also makes the application easier to run in development environments.
   * * The default value should be safe and non-privileged.
   *
   * How to Use:
   *
   * 1.  Installation (if using `.env` files):
   * * If you're not using NEXT.js or a framework that automatically handles environment variables, install `dotenv`:
   * ```bash
   * npm install dotenv
   * ```
   *
   * 2.  Create a `.env.local` file:
   * * In your project's root directory, create a file named `.env.local`.
   * * Add your environment variables to this file:
   * ```
   * NEXT_PUBLIC_API_URL=[https://your-api-url.com](https://your-api-url.com)  #  Your actual API URL
   * #  DO NOT PUT SECRETS HERE IF COMMITTING TO A REPOSITORY
   * ```
   * * If you are using a framework like NEXT.js, you'll use `.env.local` or `.env.production`
   *
   * 3.  Import and Use the Configuration:
   * * In any file where you need to access the configuration, import the `getAppConfig` function:
   * ```javascript
   * import getAppConfig from './config'; // Adjust the path if needed
   *
   * const config = getAppConfig();
   * console.log(config.apiUrl); //  Access the API URL
   * console.log(config.timeout);
   *
   * //  * DO NOT try to modify the config object if you use Object.freeze
   * // config.apiUrl = 'some-other-url';  // This will cause an error if frozen.
   * ```
   *
   * 4.  Set Environment Variables:
   * * **IMPORTANT:** For production, you should set environment variables on your server or hosting provider (e.g., in Netlify, Vercel, AWS, etc.).  Do *not* rely on `.env` files in production, especially if they contain secrets.
   *
   * 5.  NEXT.js Notes:
   * * NEXT.js has built-in support for `.env` files.
   * * Environment variables in NEXT.js that are exposed to the client-side *must* be prefixed with `NEXT_PUBLIC_`.  Variables without this prefix are only available on the server-side.
   *
   * 6.  TypeScript Support
   * * If you are using TypeScript, you can create a type for the configuration
   *
   * Example Usage with Fetch:
   *
   * ```javascript
   * import getAppConfig from './config';
   *
   * const config = getAppConfig();
   *
   * async function fetchData() {
   * try {
   * const response = await fetch(`${config.apiUrl}/your-endpoint`, {
   * method: 'GET',
   * headers: {
   * 'Content-Type': 'application/json',
   * //  * DO NOT include API keys in headers unless absolutely necessary and secure.
   * // 'Authorization': `Bearer ${process.env.API_KEY}`
   * },
   * timeout: config.timeout, //if fetch supports timeout
   * });
   *
   * if (!response.ok) {
   * throw new Error(`HTTP error! Status: ${response.status}`);
   * }
   *
   * const data = await response.json();
   * console.log(data);
   * } catch (error) {
   * console.error('Error fetching data:', error);
   * //  * Handle errors gracefully (e.g., show a user-friendly message).
   * }
   * }
   *
   * fetchData();
   * ```
   */
  