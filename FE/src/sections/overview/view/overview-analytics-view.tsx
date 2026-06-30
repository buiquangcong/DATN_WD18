import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useState, useEffect } from 'react';
import axios from 'axios';

import { DashboardContent } from 'src/layouts/dashboard';
import { _posts, _tasks, _traffic, _timeline } from 'src/_mock';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    newBookings: 0,
    totalRevenue: 0,
    totalTrips: 0
  });

  const [trips, setTrips] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/statistics/dashboard');
        if (response.data && response.data.data) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
      }
    };

    const fetchTrips = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/trip');
        const tripsData = Array.isArray(response.data) ? response.data : response.data?.data || [];
        setTrips(tripsData.slice(-5).reverse());
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    fetchStats();
    fetchTrips();
  }, []);

  const mappedTrips = trips.map((trip, index) => ({
    id: trip._id,
    title: `${trip.journey?.diemDi || 'Chưa cập nhật'} ➞ ${trip.journey?.diemDen || 'Chưa cập nhật'}`,
    description: `Xe: ${trip.bus?.name || ''} (${trip.bus?.licensePlates || 'N/A'}) - Trạng thái: ${trip.status}`,
    coverUrl: _posts[index % _posts.length].coverUrl,
    postedAt: trip.departureTime || trip.createdAt,
  }));


  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Tổng doanh thu"
            percent={0}
            total={stats.totalRevenue}
            icon={<img alt="Weekly sales" src="/assets/icons/glass/ic-glass-bag.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [22, 8, 35, 50, 82, 84, 77, 12],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Tổng lượt đi mới"
            percent={0}
            total={stats.newBookings}
            color="secondary"
            icon={<img alt="New users" src="/assets/icons/glass/ic-glass-users.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [56, 47, 40, 62, 73, 30, 23, 54],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Tổng số lượt đặt vé"
            percent={0}
            total={stats.totalBookings}
            color="warning"
            icon={<img alt="Purchase orders" src="/assets/icons/glass/ic-glass-buy.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [40, 70, 50, 28, 70, 75, 7, 64],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AnalyticsWidgetSummary
            title="Tổng chuyến xe chạy"
            percent={0}
            total={stats.totalTrips}
            color="error"
            icon={<img alt="Messages" src="/assets/icons/glass/ic-glass-message.svg" />}
            chart={{
              categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
              series: [56, 30, 23, 54, 47, 40, 62, 73],
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <AnalyticsNews title="Chuyến xe nổi bật" list={mappedTrips} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
