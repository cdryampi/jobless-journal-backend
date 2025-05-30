// backend/server.js
const cors = require('cors');
const express = require('express');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs');
const matter = require('gray-matter');
const { marked } = require('marked');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// configuración del dotenv
const dotenv = require('dotenv');
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Configuración de CORS para API backend independiente
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://jobless-journal.yampi.eu']
    : true, // Permite cualquier origen en desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
// Configuración de la ruta para los posts
const postsDir = path.join(__dirname, 'posts');

// Configuración de OpenAI

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});


const PORT = process.env.PORT || 3001;

// Middleware para logging en producción
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'Sin trabajo desde hace 84 años...',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/posts', (req, res) => {
  try {
    // Verificar que el directorio existe
    if (!fs.existsSync(postsDir)) {
      return res.status(500).json({ error: 'Posts directory not found' });
    }

    const files = fs.readdirSync(postsDir);

    const posts = files
      .filter(filename => filename.endsWith('.md'))
      .map(filename => {
        try {
          const slug = filename.replace('.md', '');
          const fileContent = fs.readFileSync(path.join(postsDir, filename), 'utf-8');
          const { data } = matter(fileContent);
          return { slug, ...data };
        } catch (error) {
          console.error(`Error reading file ${filename}:`, error);
          return null;
        }
      })
      .filter(post => post !== null);

    res.json(posts);
  } catch (error) {
    console.error('Error in /api/posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/posts/:slug', (req, res) => {
  const { slug } = req.params;
  const filePath = path.join(postsDir, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Post no encontrado' });
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { content, data } = matter(fileContent);
  const htmlContent = marked(content);

  res.json({ slug, content: htmlContent, ...data });
});
// Endpoint para generar respuestas con OpenAI
app.post('/api/gpt/comentar', express.json(), async (req, res) => {
  const { content } = req.body;
  const { slug } = req.body;
  if (!slug) {
    return res.status(400).json({ error: 'Falta slug para el comentario' });
  }

  if (!content) {
    return res.status(400).json({ error: 'Falta contenido para comentar' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Eres un crítico existencial, cruel y nihilista. Comentás textos del usuario con sarcasmo y desprecio, sin dar ánimos ni sugerencias útiles.'
        },
        {
          role: 'user',
          content: `Comenta con ironía este post del Jobless Journal:\n\n${content}`
        }
      ],
      temperature: 0.9,
      max_tokens: 300
    });

    const comentario = completion.choices[0].message.content;
    // Guardamos el comentario en la base de datos de Supabase
    const { data, error } = await supabase
      .from('comments')
      .insert([{ content: comentario, slug}])
      .select();
    res.json({ comentario });
    } catch (err) {
      console.error('Error IA:', err);
      res.status(500).json({ error: 'La IA está demasiado decepcionada para responder.' });
    }
});

// 🔹 Obtener comentarios por slug
app.get('/api/comments/:slug', async (req, res) => {
  const { slug } = req.params;

  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('slug', slug)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[GET comments] error:', error);
    return res.status(500).json({ error: 'No se pudieron cargar los comentarios' });
  }

  res.json(data);
});

// 🔹 Agregar nuevo comentario
app.post('/api/comments/:slug', async (req, res) => {
  // Aseguramos que el cuerpo de la solicitud tenga el formato correcto
  if (!req.body || !req.body.content) {
    return res.status(400).json({ error: 'Falta contenido en el comentario' });
  }
  const { slug } = req.params;
  const { content } = req.body;

  if (!content || !slug) {
    return res.status(400).json({ error: 'Falta contenido o slug' });
  }

  const { data, error } = await supabase
    .from('comments')
    .insert([{ content, slug }])
    .select();

  if (error) {
    console.error('[POST comment] error:', error);
    return res.status(500).json({ error: 'No se pudo agregar el comentario' });
  }  res.status(201).json(data[0]);
});

// API health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'jobless-journal-backend'
  });
});

// Servir archivos estáticos del frontend
if (process.env.NODE_ENV === 'production') {
  // Servir archivos estáticos del frontend
  app.use(express.static(path.join(__dirname, 'public')));
  // Catch-all para SPA - debe ir después de todas las rutas API
  app.get('*', (req, res) => {
    // Solo servir index.html para rutas que no sean API
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    
    const indexPath = path.join(__dirname, 'public', 'index.html');
    
    if (!fs.existsSync(indexPath)) {
      return res.status(500).json({ error: 'Frontend not built or missing' });
    }
    
    res.sendFile(indexPath);
  });
} else {
  // En desarrollo, solo manejar rutas API no encontradas
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });
}

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`💀 Jobless Journal corriendo en http://0.0.0.0:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS habilitado para: ${process.env.NODE_ENV === 'production' ? 'orígenes configurados' : 'todos los orígenes'}`);
  console.log(`API disponible en: http://0.0.0.0:${PORT}/api`);
  console.log(`Health check: http://0.0.0.0:${PORT}/api/health`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`Frontend servido desde: ${path.join(__dirname, 'public')}`);
    const indexExists = fs.existsSync(path.join(__dirname, 'public', 'index.html'));
    console.log(`Frontend disponible: ${indexExists ? 'SÍ' : 'NO'}`);
  }
});

// Graceful shutdown para Dokploy/Docker
process.on('SIGTERM', () => {
  console.log('💀 Recibido SIGTERM, cerrando servidor gracefully...');
  server.close(() => {
    console.log('💀 Servidor cerrado.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('💀 Recibido SIGINT, cerrando servidor gracefully...');
  server.close(() => {
    console.log('💀 Servidor cerrado.');
    process.exit(0);
  });
});

