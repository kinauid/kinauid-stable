import { buildEncryptedUrl } from "~/utils/cryptoState";

export interface SubMenuItem {
  label: string;
  href: string;
  badge?: string;
}

export interface NavLinkItem {
  label: string;
  href: string;
  icon: string;
  badge?: string;
  children?: SubMenuItem[];
}

export interface NavGroup {
  groupTitle: string;
  items: NavLinkItem[];
}

export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    groupTitle: "UTAMA",
    items: [
      {
        label: "Performa Perusahaan",
        href: "/app/dashboard",
        icon: "LayoutDashboard",
      },
      {
        label: "Pusat Data & Drive",
        href: "/app/drive/customer",
        icon: "HardDrive",
        badge: "Drive",
        children: [
          { label: "File Customer", href: "/app/drive/customer" },
          { label: "Internal Workshop", href: "/app/drive/internal" },
        ],
      },
      {
        label: "Studio Desain & Custom",
        href: "/customer/configure",
        icon: "Sparkles",
        badge: "3D",
      },
      {
        label: "Antrian Desain & Template",
        href: "/app/setting/design",
        icon: "LayoutTemplate",
        badge: "Desain",
      },
    ],
  },
  {
    groupTitle: "PESANAN & PRODUKSI",
    items: [
      {
        label: "Input Pesanan",
        href: "/app/order-form",
        icon: "PlusCircle",
        badge: "Baru",
      },
      {
        label: "Daftar Pesanan",
        href: "/app/order-list",
        icon: "FileText",
        badge: "Live",
        children: [
          {
            label: "Semua Pesanan",
            href: buildEncryptedUrl("/app/order-list", { tab: "all" }),
          },
          {
            label: "Antrean Cetak & Sablon",
            href: buildEncryptedUrl("/app/order-list", { tab: "production" }),
            badge: "12",
          },
          {
            label: "Pesanan KKN / Kampus",
            href: buildEncryptedUrl("/app/order-list", { tab: "kkn" }),
          },
          {
            label: "Pesanan Reguler",
            href: buildEncryptedUrl("/app/order-list", { tab: "reguler" }),
          },
        ],
      },
      {
        label: "Area Cetak & Print",
        href: "/app/print-area",
        icon: "Printer",
        badge: "Cetak",
      },
      {
        label: "Email & Broadcast Blast",
        href: "/app/email",
        icon: "Mail",
        badge: "Email",
      },
      {
        label: "Katalog & Produk",
        href: "/app/product-list",
        icon: "Tag",
        children: [
          {
            label: "ID Card & Lanyard",
            href: buildEncryptedUrl("/app/product-list", { cat: "idcard" }),
          },
          {
            label: "Jersey Sublimasi",
            href: buildEncryptedUrl("/app/product-list", { cat: "jersey" }),
          },
          {
            label: "Kaos & Polo Shirt",
            href: buildEncryptedUrl("/app/product-list", { cat: "tshirt" }),
          },
          {
            label: "Jaket & Hoodie",
            href: buildEncryptedUrl("/app/product-list", { cat: "jacket" }),
          },
        ],
      },
      {
        label: "Pengadaan & Belanja",
        href: "/app/procurement/shopping",
        icon: "ShoppingCart",
        children: [
          { label: "Belanja Bahan Baku", href: "/app/procurement/shopping" },
          {
            label: "Stok & Inventori Bahan",
            href: "/app/procurement/stock",
            badge: "Alert",
          },
          { label: "Supplier Rekanan", href: "/app/procurement/suppliers" },
        ],
      },
      { label: "Riwayat Pesanan", href: "/app/order-history", icon: "History" },
    ],
  },
  {
    groupTitle: "KEUANGAN & KAS",
    items: [
      {
        label: "Keuangan (Kas)",
        href: "/app/finance",
        icon: "Coins",
        children: [
          { label: "Buku Kas Operasional", href: "/app/finance" },
          { label: "Arus Kas (Cashflow)", href: "/app/finance/cashflow" },
          {
            label: "Gaji & Upah Karyawan",
            href: "/app/finance/salary-employee",
          },
        ],
      },
      {
        label: "Laporan Akuntansi",
        href: "/app/finance/reports",
        icon: "FileSpreadsheet",
        children: [
          {
            label: "Laba Rugi (P&L)",
            href: buildEncryptedUrl("/app/finance/reports", { tab: "pl" }),
          },
          {
            label: "Neraca Keuangan",
            href: buildEncryptedUrl("/app/finance/reports", { tab: "balance" }),
          },
          {
            label: "Jurnal Transaksi",
            href: buildEncryptedUrl("/app/finance/reports", { tab: "journal" }),
          },
        ],
      },
      {
        label: "Akun Kas & Bank",
        href: "/app/finance/account",
        icon: "Landmark",
      },
    ],
  },
  {
    groupTitle: "MASTER & VENDOR",
    items: [
      { label: "Master Supplier", href: "/app/master/supplier", icon: "Truck" },
      {
        label: "Manajemen Institusi",
        href: "/app/master/institution",
        icon: "Building",
        children: [
          {
            label: "Daftar Kampus / BEM",
            href: buildEncryptedUrl("/app/master/institution", {
              type: "campus",
            }),
          },
          {
            label: "Komunitas & Partner",
            href: buildEncryptedUrl("/app/master/institution", {
              type: "corporate",
            }),
          },
        ],
      },
      { label: "Inventaris Aset", href: "/app/asset/inventory", icon: "Cpu" },
    ],
  },
  {
    groupTitle: "SISTEM & AKSES",
    items: [
      {
        label: "Error Telemetry & Logs",
        href: "/app/system/error-logs",
        icon: "AlertTriangle",
        badge: "Live",
      },
      {
        label: "Tiket & Aduan Masalah",
        href: "/app/system/tickets",
        icon: "LifeBuoy",
      },
      {
        label: "Manajemen Akun",
        href: "/dashboard/admin/manage",
        icon: "UserCog",
        badge: "RBAC",
        children: [
          {
            label: "Pengguna & Staff",
            href: buildEncryptedUrl("/dashboard/admin/manage", {
              tab: "users",
            }),
          },
          {
            label: "Role & Hak Akses",
            href: buildEncryptedUrl("/dashboard/admin/manage", {
              tab: "roles",
            }),
          },
        ],
      },
      {
        label: "Backend Bridge",
        href: "/app/setting/bridge",
        icon: "ArrowRightLeft",
      },
      {
        label: "Recycle Bin",
        href: "/app/setting/recycle-bin",
        icon: "Recycle",
      },
    ],
  },
];
