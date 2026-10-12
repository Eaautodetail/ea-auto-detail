import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70vh] flex-col items-start justify-center pb-20 pt-40">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-mist-400">Fel 404</p>
      <h1 className="font-display mt-4 text-4xl font-extrabold text-white sm:text-6xl">Sidan finns inte.</h1>
      <p className="mt-4 max-w-md text-mist-300">Länken kan vara fel eller så har sidan flyttats.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/">Till startsidan</ButtonLink>
        <ButtonLink href="/boka" variant="secondary">
          Boka tid
        </ButtonLink>
      </div>
    </Container>
  );
}
