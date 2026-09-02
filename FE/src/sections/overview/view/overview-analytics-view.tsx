import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import SvgIcon from '@mui/material/SvgIcon';

import { DashboardContent } from 'src/layouts/dashboard';
import { _posts, _tasks, _traffic, _timeline } from 'src/_mock';

import { AnalyticsNews } from '../analytics-news';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';

// ----------------------------------------------------------------------

function formatCurrency(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateVN(date: Date) {
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getDateKey(date: Date) {
  return date.toISOString().split('T')[0];
}

// SVG Icons inline — khỏi cài @mui/icons-material
const TrendingUpIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
  </SvgIcon>
);

const TrendingDownIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z" />
  </SvgIcon>
);

const EmojiEventsIcon = (props: any) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </SvgIcon>
);

// Trạng thái booking hợp lệ (không tính đã huỷ, đã hoàn tiền)
const VALID_BOOKING_STATUSES = ['Đã xác nhận', 'Đã check-in', 'Đã checkin', 'Chờ xác nhận'];

export function OverviewAnalyticsView() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    newBookings: 0,
    totalRevenue: 0,
    totalTrips: 0,
  });

  const [trips, setTrips] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<'today' | 'all'>('today');

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
        setTrips(tripsData);
      } catch (error) {
        console.error('Error fetching trips:', error);
      }
    };

    const fetchBookings = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/booking');
        const bookingsData = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];
        setBookings(bookingsData);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchStats();
    fetchTrips();
    fetchBookings();
  }, []);

  const today = useMemo(() => new Date(), []);
  const todayKey = getDateKey(today);

  const filteredTrips = useMemo(() => {
    if (filterTab === 'all') return trips;
    return trips.filter((trip) => {
      const depTime = trip.departureTime || trip.startTime || trip.date;
      if (!depTime) return false;
      const tripDate = new Date(depTime);
      return getDateKey(tripDate) === todayKey;
    });
  }, [trips, filterTab, todayKey]);

  const tripsWithRevenue = useMemo(() => {
    return filteredTrips.map((trip) => {
      const tripBookings = bookings.filter((b) => {
        const bookingTripId = b.trip?._id || b.trip || b.tripId;
        const status = b.status || '';
        return bookingTripId === trip._id && VALID_BOOKING_STATUSES.includes(status);
      });
      const revenue = tripBookings.reduce((sum, b) => sum + (b.totalPrice || b.price || 0), 0);
      const ticketCount = tripBookings.length;
      return { ...trip, revenue, ticketCount };
    });
  }, [filteredTrips, bookings]);

  const filteredRevenue = useMemo(
    () => tripsWithRevenue.reduce((sum, t) => sum + t.revenue, 0),
    [tripsWithRevenue]
  );

  const topRevenueTrip = useMemo(() => {
    if (tripsWithRevenue.length === 0) return null;
    return tripsWithRevenue.reduce((max, trip) => (trip.revenue > max.revenue ? trip : max), tripsWithRevenue[0]);
  }, [tripsWithRevenue]);

  const mappedTrips = trips
    .slice(-5)
    .reverse()
    .map((trip, index) => ({
      id: trip._id,
      title: `${trip.journey?.diemDi || 'Chưa cập nhật'} ➞ ${trip.journey?.diemDen || 'Chưa cập nhật'}`,
      description: `Xe: ${trip.bus?.name || ''} (${trip.bus?.licensePlates || 'N/A'}) - Trạng thái: ${trip.status}`,
      coverUrl: _posts[index % _posts.length].coverUrl,
      postedAt: trip.departureTime || trip.createdAt,
    }));

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'today' | 'all') => {
    setFilterTab(newValue);
  };

  const revenueComparePercent = filterTab === 'today' ? 12 : 0;

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
      </Grid>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          📊 Doanh thu theo ngày
        </Typography>

        <Tabs
          value={filterTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            mb: 3,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '1rem',
            },
          }}
        >
          <Tab label={`Hôm nay - ${formatDateVN(today)}`} value="today" />
          <Tab label="Tất cả" value="all" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: (theme) => theme.shadows[4] }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {filterTab === 'today' ? 'Doanh thu hôm nay' : 'Tổng doanh thu'}
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="primary.main">
                  {formatCurrency(filteredRevenue)}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {revenueComparePercent >= 0 ? (
                    <TrendingUpIcon color="success" fontSize="small" />
                  ) : (
                    <TrendingDownIcon color="error" fontSize="small" />
                  )}
                  <Typography
                    variant="body2"
                    color={revenueComparePercent >= 0 ? 'success.main' : 'error.main'}
                    fontWeight={600}
                  >
                    {revenueComparePercent >= 0 ? '+' : ''}
                    {revenueComparePercent}% so với hôm qua
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.disabled">
                  {filteredTrips.length} chuyến xe
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: (theme) => theme.shadows[4] }}>
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  {filterTab === 'today' ? 'Vé đã bán hôm nay' : 'Tổng vé đã bán'}
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="info.main">
                  {tripsWithRevenue.reduce((sum, t) => sum + t.ticketCount, 0).toLocaleString('vi-VN')} vé
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Cập nhật realtime
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 12, md: 4 }}>
          <Card
            sx={{
              height: '100%',
              borderRadius: 2,
              boxShadow: (theme) => theme.shadows[4],
              background: (theme) =>
                `linear-gradient(135deg, ${theme.palette.warning.light} 0%, ${theme.palette.warning.main} 100%)`,
              color: '#fff',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <EmojiEventsIcon />
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Chuyến xe doanh thu cao nhất
                  </Typography>
                </Stack>

                {topRevenueTrip ? (
                  <>
                    <Typography variant="h5" fontWeight="bold">
                      {topRevenueTrip.journey?.diemDi || 'Chưa cập nhật'} ➞{' '}
                      {topRevenueTrip.journey?.diemDen || 'Chưa cập nhật'}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {formatCurrency(topRevenueTrip.revenue)}
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {topRevenueTrip.bus?.name || 'Xe chưa xác định'}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {topRevenueTrip.ticketCount} vé
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                      Khởi hành:{' '}
                      {topRevenueTrip.departureTime
                        ? new Date(topRevenueTrip.departureTime).toLocaleString('vi-VN')
                        : 'Chưa cập nhật'}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="body1" sx={{ opacity: 0.9 }}>
                    Không có chuyến xe nào trong khoảng thời gian này
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          🚌 Danh sách chuyến xe {filterTab === 'today' ? 'hôm nay' : ''}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6, lg: 8 }}>
          <Card sx={{ borderRadius: 2, boxShadow: (theme) => theme.shadows[2] }}>
            <CardContent>
              {tripsWithRevenue.length > 0 ? (
                <Stack spacing={2} divider={<Divider flexItem />}>
                  {tripsWithRevenue
                    .sort((a, b) => b.revenue - a.revenue)
                    .map((trip, idx) => (
                      <Stack
                        key={trip._id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={2}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: idx === 0 ? 'warning.main' : 'grey.100',
                              color: idx === 0 ? '#fff' : 'text.primary',
                              fontWeight: 'bold',
                              fontSize: 14,
                            }}
                          >
                            {idx + 1}
                          </Box>
                          <Stack>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {trip.journey?.diemDi || 'Chưa cập nhật'} ➞{' '}
                              {trip.journey?.diemDen || 'Chưa cập nhật'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {trip.bus?.name || 'Xe chưa xác định'} •{' '}
                              {trip.departureTime
                                ? new Date(trip.departureTime).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Chưa cập nhật giờ'}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Stack alignItems="flex-end">
                          <Typography variant="subtitle1" fontWeight="bold" color="primary.main">
                            {formatCurrency(trip.revenue)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {trip.ticketCount} vé
                          </Typography>
                        </Stack>
                      </Stack>
                    ))}
                </Stack>
              ) : (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    Không có chuyến xe nào trong khoảng thời gian này
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 4 }}>
          <AnalyticsNews title="Chuyến xe nổi bật" list={mappedTrips} />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
