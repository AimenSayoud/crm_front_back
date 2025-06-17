FROM postgres:14

# Environment variables
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=123
ENV POSTGRES_DB=recruitment_plus

# Create a custom directory for initialization scripts
RUN mkdir -p /docker-entrypoint-initdb.d

# Health check
HEALTHCHECK --interval=5s --timeout=5s --retries=3 CMD pg_isready -U postgres -d recruitment_plus || exit 1

# Set timezone
RUN ln -sf /usr/share/zoneinfo/UTC /etc/localtime

# Expose the PostgreSQL port
EXPOSE 5432

# Set the default command to run when starting the container
CMD ["postgres"]