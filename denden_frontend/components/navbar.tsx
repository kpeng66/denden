import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <nav>
      <Link href="/register">Register</Link>
      <Link href="/login">Login</Link>
    </nav>
  );
}

export default Navbar;
