const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const os = require("os");

const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/download', (req, res) => {
    const videoUrl = req.query.url;
    const quality = req.query.quality;
    const format = req.query.format;
    const downloadType = req.query.type;

    if (!videoUrl) {
        return res.status(400).send('URL no proporcionada');
    }

    let downloadPath;
    const platform = os.platform();

    if (platform === 'win32') {
        downloadPath = path.join('C:', 'Users', process.env.USERNAME, 'Downloads', '%(title)s.%(ext)s');
    } else if (platform === 'darwin') {
        downloadPath = path.join('/Users', process.env.USER, 'Downloads', '%(title)s.%(ext)s');
    } else {
        downloadPath = path.join('/home', process.env.USER, 'Downloads', '%(title)s.%(ext)s');
    }

    let command;
    if (downloadType === 'video') {
        const [width, height] = quality.split('x').map(Number);
        command = `yt-dlp -f "bv*[height=${height}][width=${width}]+ba/b" --merge-output-format mp4 -o "${downloadPath}" "${videoUrl}"`;
    } else {
        // Comando modificado para audio
        command = `yt-dlp --extract-audio --format bestaudio --audio-format mp3 --audio-quality 0 --postprocessor-args "-ar 44100" -o "${downloadPath}" "${videoUrl}"`;
    }

    console.log('Ejecutando comando:', command);

    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
            console.error('Error completo:', error);
            return res.status(500).send(`
                <script>
                    alert("Error al descargar. Por favor verifica que la URL sea correcta.");
                    window.location.href = "/";
                </script>
            `);
        }

        if (stderr) {
            console.log('Stderr:', stderr);
        }

        console.log('Stdout:', stdout);
        res.send(`
            <script>
                alert("Descarga completada con éxito!");
                window.location.href = "/";
            </script>
        `);
    });
});


app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send(`
        <script>
            alert("Ocurrió un error en el servidor. Por favor intenta nuevamente.");
            window.location.href = "/";
        </script>
    `);
});

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});