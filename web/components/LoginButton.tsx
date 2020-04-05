import Link from "next/link";
interface Props {
  isAuthed: boolean;
}
function Button({ isAuthed }: Props) {
  if (!isAuthed) {
    return (
      <Link href="/api/login">
        <a>Login</a>
      </Link>
    );
  } else {
    return (
      <Link href="/api/logout">
        <a>Logout</a>
      </Link>
    );
  }
}

function LoginButton({ isAuthed }: Props) {
  return (
    <h2 className="text-sm text-center text-teal-300 align-baseline">
      <Button isAuthed={isAuthed} />
    </h2>
  );
}
export default LoginButton;
