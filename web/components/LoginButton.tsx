import Link from "next/link";
interface Props {
  isAuthed: boolean;
}
function Button({ isAuthed }: Props) {
  if (!isAuthed) {
    return <a href="/api/login">Login</a>;
  } else {
    return <a href="/api/logout">Logout</a>;
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
