import CardsCollectedCard from "@/components/user/calendar/CardsCollectedCard";
import EventsAttendedCard from "@/components/user/calendar/EventsAttendedCard";
import PacksCard from "@/components/user/calendar/PacksCard";
import RsvpCard from "@/components/user/calendar/RsvpCard";

export default function CalendarMainContent() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EventsAttendedCard />
        <RsvpCard />
        <CardsCollectedCard />
        <PacksCard />
      </div>
    </div>
  );
}
