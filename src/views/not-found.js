const createNotFoundPage = () => {
  return `
    <div class="not-found">
      <h1>404</h1>
      <h2>Halaman Tidak Ditemukan</h2>
      <p>Maaf, halaman yang Anda cari tidak dapat ditemukan.</p>
      <a href="#/home" class="btn-back">Kembali ke Beranda</a>
    </div>
  `;
};

export default createNotFoundPage; 