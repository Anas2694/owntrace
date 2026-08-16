# Architecture

OwnTrace begins as a modular MERN application in one repository.

## Runtime structure

- `client/`: responsive React/Vite web application
- `server/`: Express REST API and future MongoDB access through Mongoose
- `docs/`: architecture, ownership, security, and API agreements

During local development, Vite proxies `/api` requests to the Express server on port `5000`. The frontend Axios client uses credentials so future authentication can rely on secure httpOnly cookies.

Backend code is organized by routes, controllers, configuration, and—when milestones need them—models, middleware, services, and utilities. Feature modules should be introduced only as their milestones begin; OwnTrace will remain a single backend rather than premature microservices.

Privacy-sensitive integrations should store derived metadata instead of full source content wherever possible. Feature boundaries communicate through owned REST APIs rather than duplicated business logic.
