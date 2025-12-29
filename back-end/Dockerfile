# 1단계: 백엔드 빌드
FROM node:20-alpine AS backend-builder
WORKDIR /usr/src/app/back-end
COPY back-end/package*.json ./
RUN npm install
COPY back-end/ ./
RUN npm run build

# 2단계: 프론트엔드 빌드
FROM node:20-alpine AS frontend-builder
WORKDIR /usr/src/app/front-end
COPY front-end/package*.json ./
RUN npm install
COPY front-end/ ./
RUN mkdir -p /usr/src/app/back-end
RUN npm run pbuild

# 3단계: 런타임 환경
FROM node:20-alpine
WORKDIR /usr/src/app
COPY back-end/package*.json ./
RUN npm install
COPY back-end/tsconfig.json ./tsconfig.json
COPY --from=backend-builder /usr/src/app/back-end/dist ./dist
COPY --from=frontend-builder /usr/src/app/back-end/build ./build
EXPOSE ${PORT:-3000}
CMD [ "node", "dist/src/web.js" ]
