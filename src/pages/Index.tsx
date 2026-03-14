import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, ChefHat, Sparkles, Instagram, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import QRScannerDialog from '@/components/QRScannerDialog';
import logoImg from '@/assets/logo.png';

const Index = () => {
  const [scannerOpen, setScannerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-sage/20 rounded-full blur-3xl" />
        </div>

        <div className="container relative py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.img
              src={logoImg}
              alt="DynamenuAI Logo"
              className="w-20 h-20 mx-auto mb-6 rounded-2xl shadow-md ring-2 ring-primary/20 p-1 bg-card"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            />

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              AI-Powered Restaurant System
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Pesan Makanan dengan
              <span className="text-gradient"> AI Assistant</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Scan QR, chat dengan AI, dan nikmati hidangan lezat. Pengalaman makan yang lebih cerdas dan menyenangkan.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <Button
                size="lg"
                className="gap-2 h-14 px-8 text-lg"
                onClick={() => setScannerOpen(true)}
              >
                <QrCode className="w-5 h-5" />
                Scan QR Meja
              </Button>
              <Link to="/admin">
                <Button size="lg" variant="outline" className="gap-2 h-14 px-8 text-lg">
                  <ChefHat className="w-5 h-5" />
                  Dashboard Admin
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid md:grid-cols-3 gap-8"
        >
          <div className="text-center p-6 rounded-2xl bg-card border border-border">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
              <QrCode className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Scan & Order</h3>
            <p className="text-muted-foreground">
              Scan QR di meja, langsung akses menu dan pesan tanpa antri
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card border border-border">
            <div className="w-16 h-16 mx-auto bg-sage/20 rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-sage-dark" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">AI Assistant</h3>
            <p className="text-muted-foreground">
              Tanya rekomendasi, alergi, atau preferensi makanan ke AI
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl bg-card border border-border">
            <div className="w-16 h-16 mx-auto bg-coffee/10 rounded-2xl flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8 text-coffee" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Real-time Kitchen</h3>
            <p className="text-muted-foreground">
              Pesanan langsung masuk ke dapur, tracking status real-time
            </p>
          </div>
        </motion.div>
      </div>

      {/* Contact Section */}
      <div className="container py-20 border-t border-border">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Hubungi Kami
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Tertarik menggunakan DynamenuAI untuk restoran Anda? Hubungi kami melalui channel berikut.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto"
        >
          <a
            href="https://instagram.com/dynamenuai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-md transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Instagram className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground group-hover:text-primary transition-colors">Instagram</span>
            <span className="text-sm text-muted-foreground">@dynamenuai</span>
          </a>

          <a
            href="https://wa.me/6281234567890"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-md transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-xl bg-sage flex items-center justify-center">
              <Phone className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground group-hover:text-primary transition-colors">WhatsApp</span>
            <span className="text-sm text-muted-foreground">Chat langsung</span>
          </a>

          <a
            href="mailto:hello@dynamenuai.com"
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary hover:shadow-md transition-all duration-300 group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground group-hover:text-primary transition-colors">Email</span>
            <span className="text-sm text-muted-foreground">hello@dynamenuai.com</span>
          </a>

          <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
              <MapPin className="w-6 h-6 text-accent-foreground" />
            </div>
            <span className="font-medium text-foreground">Lokasi</span>
            <span className="text-sm text-muted-foreground text-center">Jakarta, Indonesia</span>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="container py-8 border-t border-border text-center flex flex-col items-center gap-2">
        <img src={logoImg} alt="DynamenuAI" className="w-8 h-8 rounded-lg ring-1 ring-primary/15 p-0.5 bg-card" />
        <p className="text-sm text-muted-foreground">
          DynamenuAI - Smart Restaurant Ordering System
        </p>
      </footer>

      {/* QR Scanner Dialog */}
      <QRScannerDialog open={scannerOpen} onOpenChange={setScannerOpen} />
    </div>
  );
};

export default Index;
