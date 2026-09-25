export interface ArticleItem {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  date: string;
  readTime: string;
  formatBadge: string;
  bannerImage?: string;
  category: string;
  tags: string[];
  summary: string;
  contentSections: {
    heading?: string;
    paragraphs: string[];
    callout?: {
      type: 'tip' | 'warning' | 'info';
      title: string;
      text: string;
    };
    table?: {
      headers: string[];
      rows: string[][];
    };
  }[];
}

export interface RecentArticleSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
}

export const SAMPLE_ARTICLES: ArticleItem[] = [
  {
    id: 'art-01',
    slug: 'panduan-memilih-bahan-jersey-dryfit-premium',
    title: 'Panduan Lengkap Memilih Bahan Kain Jersey Dryfit & Katun Combed untuk Event dan Komunitas',
    subtitle:
      'Pelajari perbedaan karakteristik rajutan Dryfit Milano, Brazil, Benzema, serta Katun Combed 24s/30s untuk memastikan kenyamanan maksimal dan ketajaman warna sublimasi permanen.',
    author: {
      name: 'Tim Teknis Kinau ID',
      role: 'Master Textile & Production Specialist',
    },
    date: '25 September 2026',
    readTime: '6 Menit Baca',
    formatBadge: 'PDF & Panduan Teknis',
    category: 'Edukasi Konveksi',
    tags: ['JerseyCustom', 'DryfitMilano', 'SublimasiFullPrint', 'KonveksiBandung', 'BahanKaos'],
    summary:
      'Panduan komprehensif mengupas struktur serat kain dryfit, perbandingan gramasi GSM, teknik sublimasi full-print anti luntur, serta standar pola jahitan rantai presisi.',
    contentSections: [
      {
        heading: '1. Memahami Struktur Serat Kain & Klasifikasi Gramasi (GSM)',
        paragraphs: [
          'Dalam industri konveksi modern dan apparel olahraga, performa jersey tidak hanya ditentukan oleh desain visual, melainkan oleh struktur rajutan benang (fabric knit structure) serta gramasi per meter persegi (GSM - Grams per Square Meter).',
          'Kain polyester dryfit berkualitas tinggi dirancang dengan pori-pori mikro (micro-mesh) yang berfungsi sebagai sistem kapiler aktif: menyerap keringat dari permukaan kulit dan menguapkannya secara instan ke udara luar.',
        ],
        callout: {
          type: 'tip',
          title: 'Tips Memilih Gramasi Ideal',
          text: 'Untuk jersey running dan cycling, gunakan dryfit dengan GSM 130–145 g/m² agar ringan dan cepat kering. Untuk jersey sepakbola, futsal, dan basket, gunakan GSM 150–170 g/m² demi ketahanan tarikan saat kontak fisik.',
        },
      },
      {
        heading: '2. Perbandingan Karakteristik Bahan Jersey Populer',
        paragraphs: [
          'Setiap jenis rajutan kain memiliki karakteristik penyerapan tinta sublimasi dan sirkulasi udara yang berbeda. Berikut adalah matriks evaluasi dari 4 varian kain unggulan workshop Kinau ID:',
        ],
        table: {
          headers: ['Jenis Bahan', 'Tekstur & Rajutan', 'Sirkulasi Udara', 'Daya Rekat Sublim', 'Rekomendasi Penggunaan'],
          rows: [
            ['Dryfit Milano', 'Pori-pori zig-zag halus', 'Sangat Tinggi (95%)', 'Warna Sangat Tajam (100%)', 'Jersey Sepakbola, Futsal, Running'],
            ['Dryfit Brazil', 'Pori-pori bintik jarum lembut', 'Tinggi (90%)', 'Warna Tajam (95%)', 'Jersey Esport, Gowes, Badminton'],
            ['Dryfit Benzema', 'Tekstur hexagonal premium', 'Sangat Tinggi (98%)', 'Gradasi Halus (98%)', 'Jersey Komunitas Premium & Event'],
            ['Cotton Combed 24s/30s', '100% Katun Alami Premium', 'Sejuk & Lembut', 'Cocok DTF / Plastisol', 'Kaos Event, Seragam Panitia, Merchandise'],
          ],
        },
      },
      {
        heading: '3. Alur Sublimasi Presisi: Menghindari Warna Pudar & Sablon Retak',
        paragraphs: [
          'Proses pewarnaan sublimasi memanfaatkan tinta sublimasi berbasis air yang dipanaskan pada suhu 200°C–215°C dengan tekanan pneumatik tinggi. Molekul tinta berubah fase dari gas langsung meresap ke dalam pori-pori serat poliester.',
          'Hasilnya: warna menyatu permanen dengan serat kain, tidak menutup sirkulasi pori-pori, dan dijamin anti retak/luntur seumur pakai meskipun dicuci berulang kali.',
        ],
        callout: {
          type: 'info',
          title: 'Standar Kalibrasi Warna Kinau ID',
          text: 'Kami menggunakan profil warna ICC tersertifikasi dengan tinta Original UltraChrome HD, menghasilkan akurasi warna hingga 99.2% sesuai rancangan file desain Anda.',
        },
      },
      {
        heading: '4. Standar Pola Potong & Jahitan Rantai Berkekuatan Tinggi',
        paragraphs: [
          'Jahitan merupakan fondasi daya tahan produk konveksi. Kinau ID mengaplikasikan jahitan overdeck 3-jarum dan jahitan rantai pundak pada setiap potong jersey dan kaos.',
          'Pola potongan dipotong secara presisi menggunakan Laser Cutting Computerized untuk memastikan simetri pola 100% pada bagian kerah, lengan raglan, dan sambungan jahitan samping.',
        ],
      },
    ],
  },
  {
    id: 'art-02',
    slug: 'perbedaan-sablon-dtf-vs-sublimasi-full-print',
    title: 'Perbedaan Sablon DTF vs Sublimasi Full Print: Mana yang Lebih Tepat untuk Kebutuhan Apparel Anda?',
    subtitle: 'Panduan menentukan teknologi sablon terbaik berdasarkan jenis bahan pakaian, kuantitas pesanan, dan budget event.',
    author: { name: 'Divisi Sablon & Pre-Press', role: 'Printing Specialist' },
    date: '22 September 2026',
    readTime: '5 Menit Baca',
    formatBadge: 'Teknologi Sablon',
    category: 'Teknik Percetakan',
    tags: ['SablonDTF', 'SublimasiFullPrint', 'Plastisol', 'CetakKaos'],
    summary: 'Ketahui kelebihan dan kekurangan sablon Direct Transfer Film (DTF) dibandingkan teknik Sublimasi Roll-to-Roll.',
    contentSections: [
      {
        heading: '1. Karakteristik Sablon Digital Transfer Film (DTF)',
        paragraphs: [
          'Sablon DTF mencetak tinta pigmen khusus ke lembaran film PET yang ditaburi bubuk lem adhesif (hot-melt adhesive powder). Sangat ideal untuk kaos berbahan katun 100%, kanvas totebag, topi, dan jaket fleece.',
          'Kelebihan utama DTF adalah fleksibilitas media: dapat diaplikasikan pada hampir semua warna kain (termasuk kain gelap) dengan detail gradasi mikro yang sangat tajam.',
        ],
      },
      {
        heading: '2. Keunggulan Sublimasi Full-Print untuk Jersey Olahraga',
        paragraphs: [
          'Sublimasi secara khusus dirancang untuk kain berbasis serat poliester. Karena tinta menyatu ke molekul kain tanpa lapisan film di atasnya, kain tetap lentur, berpori, dan sangat ringan.',
        ],
      },
    ],
  },
  {
    id: 'art-03',
    slug: 'panduan-menyiapkan-file-desain-siap-cetak',
    title: 'Cara Menyiapkan File Desain Mockup Siap Cetak (Vector AI, CDR, PDF) Bebas Pecah',
    subtitle: 'Standar resolusi DPI, mode warna CMYK vs RGB, dan tips outline font agar proses produksi berjalan cepat tanpa kendala.',
    author: { name: 'Tim Desain Grafis Kinau', role: 'Senior Graphic Designer' },
    date: '18 September 2026',
    readTime: '4 Menit Baca',
    formatBadge: 'Panduan Desain',
    category: 'Pra-Cetak',
    tags: ['FileSiapCetak', 'VectorDesign', 'CorelDraw', 'AdobeIllustrator'],
    summary: 'Langkah praktis mengekspor file mockup desain dari Illustrator, CorelDRAW, dan Photoshop dengan standar pre-press percetakan.',
    contentSections: [
      {
        heading: 'Standarisasi Profil Warna CMYK untuk Mesin Sublimasi',
        paragraphs: [
          'Selalu pastikan workspace dokumen Anda diatur ke Color Mode CMYK (FOGRA39 atau Coated GRACoL). File dalam format RGB berpotensi mengalami pergeseran warna (color shift) saat dikonversi oleh RIP software mesin cetak.',
        ],
      },
    ],
  },
  {
    id: 'art-04',
    slug: 'tips-merawat-jersey-sublimasi-dan-kaos-sablon',
    title: '5 Tips Praktis Merawat Jersey Olahraga & Kaos Sablon agar Awet Bertahun-tahun',
    subtitle: 'Cara mencuci, menyetrika, dan menyimpan pakaian konveksi agar warna tetap cerah, tidak melar, dan sablon tidak mengelupas.',
    author: { name: 'Quality Control Kinau', role: 'After-Sales & Care Specialist' },
    date: '12 September 2026',
    readTime: '3 Menit Baca',
    formatBadge: 'Perawatan Pakaian',
    category: 'Tips Konsumen',
    tags: ['PerawatanJersey', 'TipsMencuci', 'AwetTahanLama'],
    summary: 'Tips merawat pakaian olahraga berbahan dryfit dan kaos sablon katun agar terhindar dari kerusakan serat benang.',
    contentSections: [
      {
        heading: 'Hindari Penggunaan Pemutih dan Suhu Setrika Berlebih',
        paragraphs: [
          'Serat poliester dryfit sangat sensitif terhadap panas langsung di atas 150°C. Jangan menyetrika langsung di atas area sablon DTF atau polyflex, gunakan kain pelapis tipis atau setrika dari bagian dalam pakaian.',
        ],
      },
    ],
  },
];

export class ArticleService {
  static async getArticleList(): Promise<ArticleItem[]> {
    return SAMPLE_ARTICLES;
  }

  static async getArticleBySlug(slug?: string): Promise<{
    activeArticle: ArticleItem;
    recentArticles: RecentArticleSummary[];
    allArticles: ArticleItem[];
  }> {
    const active =
      SAMPLE_ARTICLES.find((a) => a.slug === slug || a.id === slug) ||
      SAMPLE_ARTICLES[0];

    const recentArticles: RecentArticleSummary[] = SAMPLE_ARTICLES.map((a) => ({
      id: a.id,
      slug: a.slug,
      title: a.title,
      category: a.category,
      date: a.date,
      readTime: a.readTime,
    }));

    return {
      activeArticle: active,
      recentArticles,
      allArticles: SAMPLE_ARTICLES,
    };
  }
}
