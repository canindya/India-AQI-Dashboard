import Navbar from './Navbar';
import Footer from './Footer';

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">{children}</main>
      <Footer />
    </>
  );
}
