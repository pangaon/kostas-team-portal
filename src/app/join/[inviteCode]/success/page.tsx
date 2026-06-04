import { Card, PageTitle, Button } from "@/components/ui";
import { PushControls } from "@/components/PushControls";

export default function JoinSuccessPage({
  params,
}: {
  params: { inviteCode: string };
}) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <div className="text-center">
        <PageTitle title="You&apos;re in! 🎉" />
        <p className="-mt-2 text-sm text-slate-600">
          Your player was added and is waiting for the coach to approve — you can
          already see the schedule.
        </p>
      </div>

      <div className="mt-6 space-y-4">
        <PushControls />

        <Card className="space-y-3 text-center">
          <Button href="/parent" className="w-full">
            Go to my team
          </Button>
          <p className="text-xs text-slate-500">
            Tip: add this to your home screen so it works like an app.
          </p>
        </Card>
      </div>
    </main>
  );
}
