"use client"
import Analytics from "../components/TripWiseAnalytics";

export default function AnalyticsPage() {
    const trip = {} as any;
    const AnalyticsComponent: any = Analytics;
    return <AnalyticsComponent trip={trip} />
}
