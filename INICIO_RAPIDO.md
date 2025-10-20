# Inicio Rápido del CRM Restaurante

## Para iniciar el proyecto en local (después de la primera configuración):

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Usuarios de prueba:

- **Administrador**: admin@restaurant.com / admin123
- **Gerente**: manager@restaurant.com / manager123

---

## Configuración inicial (solo la primera vez):

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Generar cliente de Prisma:
   ```bash
   npm run db:generate
   ```

3. Ejecutar migraciones de la base de datos:
   ```bash
   npm run db:migrate
   ```

4. Cargar datos de prueba:
   ```bash
   npm run db:seed
   ```

5. Iniciar servidor:
   ```bash
   npm run dev
   ```

---

## Comandos útiles:

- `npm run db:studio` - Abrir Prisma Studio para ver la base de datos
- `npm run db:reset` - Reiniciar la base de datos (borra todos los datos)
- `npm run lint` - Verificar el código con ESLint
- `npm run format` - Formatear el código con Prettier

---

## Requisitos previos:

- Node.js 18+
- PostgreSQL 14+