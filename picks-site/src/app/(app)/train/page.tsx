import { Button, Card, Empty, PageHeader } from "@/components/ui";

export const metadata = { title: "Train" };

export default function TrainPage() {
  return (
    <>
      <PageHeader title="Train">
        <Button disabled>Train</Button>
      </PageHeader>
      <Card title="Last graded week">
        <Empty>Week 11 (Nov 14) is imported and graded; see History. Metrics and proposals arrive in milestone 5.</Empty>
      </Card>
      <Card title="Season to date">
        <Empty>Record by market and tier, calibration chart, margin and total error: milestone 5.</Empty>
      </Card>
      <Card title="Proposed adjustments">
        <Empty>No proposals. Nothing changes the live model without your approval.</Empty>
      </Card>
    </>
  );
}
