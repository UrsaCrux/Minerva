# Anuncios — Guía de implementación

> **Estado:** Base de datos y Storage configurados. Frontend pendiente.

---

## 1. Qué se creó en la base de datos

### Tabla `public.anuncios`

```sql
id            bigint          PK, auto-increment
created_at    timestamptz     Timestamp de inserción (automático)
updated_at    timestamptz     Timestamp de última edición (automático via trigger)
fecha         date            Fecha del anuncio (editable, default: hoy)
titulo        text            Título — requerido
cuerpo        text            Cuerpo/contenido — requerido
imagen_url    text            URL de imagen adjunta — opcional
publicado_por uuid → profiles Autor del anuncio — requerido (default: auth.uid())
```

El campo `updated_at` se mantiene sincronizado automáticamente gracias al trigger `anuncios_updated_at` que llama a la función `public.set_updated_at()`.

### Row Level Security (RLS)

| Operación | Quién puede |
|-----------|-------------|
| `SELECT`  | Cualquier usuario autenticado |
| `INSERT`  | Cualquier usuario autenticado (el autor debe ser `auth.uid()`) |
| `UPDATE`  | Solo el autor original del anuncio |
| `DELETE`  | Solo el autor original del anuncio |

> Para restringir la publicación a jefes de equipo u otros roles, añade una condición extra en la policy `INSERT` consultando `public.team_members.role` o `public.permisos_usuarios`.

### Storage bucket `anuncios`

- **Acceso:** Lectura pública, escritura autenticada, borrado solo por el propietario del archivo.
- **Límite:** 5 MB por imagen.
- **Tipos permitidos:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`.

---

## 2. Cómo implementarlo en el frontend

### 2.1 Leer anuncios

```js
import { createClient } from '@/utils/supabase/client';

export async function getAnuncios() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('anuncios')
    .select(`
      id, fecha, titulo, cuerpo, imagen_url, created_at,
      publicado_por ( id, full_name, avatar_url )
    `)
    .order('fecha', { ascending: false });

  if (error) throw error;
  return data;
}
```

### 2.2 Crear un anuncio (sin imagen)

```js
export async function crearAnuncio({ titulo, cuerpo, fecha }) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('anuncios')
    .insert({ titulo, cuerpo, fecha })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 2.3 Subir imagen y crear anuncio

```js
export async function crearAnuncioConImagen({ titulo, cuerpo, fecha, imagenFile }) {
  const supabase = createClient();

  // 1. Subir imagen al bucket
  const ext = imagenFile.name.split('.').pop();
  const path = `${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('anuncios')
    .upload(path, imagenFile, { upsert: false });

  if (uploadError) throw uploadError;

  // 2. Obtener la URL pública
  const { data: { publicUrl } } = supabase.storage
    .from('anuncios')
    .getPublicUrl(path);

  // 3. Insertar el anuncio con la URL
  const { data, error } = await supabase
    .from('anuncios')
    .insert({ titulo, cuerpo, fecha, imagen_url: publicUrl })
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 2.4 Editar un anuncio

```js
export async function editarAnuncio(id, campos) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('anuncios')
    .update(campos)         // { titulo?, cuerpo?, fecha?, imagen_url? }
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

### 2.5 Eliminar un anuncio

```js
export async function eliminarAnuncio(id) {
  const supabase = createClient();
  const { error } = await supabase
    .from('anuncios')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
```

---

## 3. Sugerencia de estructura de página

```
src/app/
└── anuncios/
    ├── page.js              ← lista paginada de anuncios
    ├── anuncios.css         ← estilos con el design system Galactic Oversight
    └── components/
        ├── AnuncioCard.js   ← tarjeta individual (imagen, fecha, autor, cuerpo)
        └── AnuncioForm.js   ← formulario de creación/edición (con upload de imagen)
```

### Campos del formulario `AnuncioForm`

| Campo | Tipo de input | Requerido |
|-------|---------------|-----------|
| Título | `<input type="text">` | ✅ |
| Cuerpo | `<textarea>` | ✅ |
| Fecha | `<input type="date">` | ✅ |
| Imagen | `<input type="file" accept="image/*">` | ❌ |

---

## 4. Control de acceso en el frontend

La política RLS actual permite que **cualquier usuario autenticado** publique anuncios. Si en el futuro se quiere restringirlo a ciertos roles, hay dos opciones:

**Opción A — Solo en el frontend (recomendado para empezar):**
Condicionar el renderizado del botón "Nuevo anuncio" al rol del usuario:

```js
// Ejemplo: solo jefes de equipo (team_members.role = 'jefe')
const puedePublicar = rolDelUsuario === 'jefe';
```

**Opción B — Enforced en la base de datos:**
Reemplazar la policy `INSERT` por una que consulte `team_members`:

```sql
CREATE POLICY "anuncios_insert_leaders_only"
  ON public.anuncios FOR INSERT TO authenticated
  WITH CHECK (
    publicado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.team_members
      WHERE user_id = auth.uid() AND role = 'jefe'
    )
  );
```
