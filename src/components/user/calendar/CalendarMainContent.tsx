import Calendar from "@/components/user/calendar/Calendar";
import CardsCollectedCard from "@/components/user/calendar/CardsCollectedCard";
import EventsCurrentlyOn from "@/components/user/calendar/EventsCurrentlyOn";
import EventsAttendedCard from "@/components/user/calendar/EventsAttendedCard";
import PacksCard from "@/components/user/calendar/PacksCard";
import RsvpCard from "@/components/user/calendar/RsvpCard";
import UpcomingEvent from "@/components/user/calendar/UpcomingEvent";

export default function CalendarMainContent() {
  return (
    <div className="flex h-full flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EventsAttendedCard />
        <RsvpCard />
        <CardsCollectedCard />
        <PacksCard />
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[3fr_2fr]">
        <Calendar />
        <div className="grid gap-4 lg:grid-rows-2">
          <UpcomingEvent />
          <EventsCurrentlyOn />
        </div>
      </div>
    </div>
  );
}
