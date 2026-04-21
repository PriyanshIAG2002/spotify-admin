export const buildOverlayPrintMarkup = (imageUrl) => `
  <!doctype html>
  <html>
    <head>
      <title>Print Spotify Card</title>
      <style>
        @page { size: 4in 6in; margin: 0; }
        html, body {
          margin: 0;
          padding: 0;
          width: 4in;
          height: 6in;
          background: #000;
        }
        body {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .print-shell {
          width: 4in;
          height: 6in;
          background: #000;
        }
        .print-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="print-shell">
        <img class="print-image" src="${imageUrl}" alt="Spotify Card" />
      </div>
      <script>
        const images = Array.from(document.images);
        Promise.all(
          images.map((img) =>
            img.complete
              ? Promise.resolve()
              : new Promise((resolve, reject) => {
                  img.onload = resolve;
                  img.onerror = reject;
                })
          )
        )
          .then(() => {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          })
          .catch(() => {
            alert('Failed to load image for printing.');
            window.close();
          });
      </script>
    </body>
  </html>
`;
