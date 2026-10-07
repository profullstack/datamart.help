FROM oven/bun:1-alpine
WORKDIR /app
COPY index.html server.ts ./
ENV PORT=3000
EXPOSE 3000
USER bun
CMD ["bun", "server.ts"]
