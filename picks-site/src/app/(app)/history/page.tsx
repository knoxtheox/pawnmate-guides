import { Button, Card, Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <>
      <PageHeader title="History">
        <Button variant="secondary" disabled>
          Add ticket
        </Button>
        <Button variant="secondary" disabled>
          Export CSV
        </Button>
      </PageHeader>
      <Card title="Picks">
        <Empty>No picks stored yet.</Empty>
      </Card>
      <Card title="Tickets">
        <Empty>No tickets yet.</Empty>
      </Card>
    </>
  );
}
