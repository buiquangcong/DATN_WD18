import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;
const renderIcon = (name: string) => <Iconify icon={name} sx={{ width: 22, height: 22 }} />;

export type NavItem = {
  title: string;
  path: string;
  icon: React.ReactNode;
  info?: React.ReactNode;
};

export const navData = [
  {
    title: 'Dashboard',
    path: '/admin',
    icon: renderIcon('solar:chart-square-bold-duotone'),
  },
  {
    title: 'Danh sách xe',
    path: '/admin/bus/list',
    icon: renderIcon('solar:bus-bold-duotone'),
  },
  {
    title: 'Danh sách nhân viên',
    path: '/admin/staff/list',
    icon: renderIcon('solar:users-group-two-rounded-bold-duotone'),
  },
  {
    title: 'Danh sách chuyến đi',
    path: '/admin/trip/list',
    icon: renderIcon('solar:routing-bold-duotone'),
  },
  {
    title: 'Danh sách tuyến đường',
    path: '/admin/journey/list',
    icon: renderIcon('solar:map-arrow-square-bold-duotone'),
  },
  {
    title: 'Cấu hình bến xe',
    path: '/admin/station/list',
    icon: renderIcon('solar:point-on-map-bold-duotone'),
  },
  {
    title: 'Danh sách tài khoản',
    path: '/admin/tk/list',
    icon: renderIcon('solar:shield-user-bold-duotone'),
  },
  {
    title: 'Danh sách Booking',
    path: '/admin/booking/list',
    icon: renderIcon('solar:ticket-sale-bold-duotone'),
  },
  {
    title: 'Đặt vé tại quầy',
    path: '/admin/offline-booking',
    icon: renderIcon('solar:ticket-bold-duotone'),
  },
  {
    title: 'Danh sách hoàn trả',
    path: '/admin/refund/list',
    icon: renderIcon('solar:hand-money-bold-duotone'),
  },
  {
    title: 'Danh sách giá vé',
    path: '/admin/giave/list',
    icon: renderIcon('solar:wad-of-money-bold-duotone'),
  },
  {
    title: 'Tin tức',
    path: '/admin/news/list',
    icon: renderIcon('solar:document-text-bold-duotone'),
  },
  {
    title: 'Ngày lễ',
    path: '/admin/holiday/list',
    icon: renderIcon('solar:calendar-bold-duotone'),
  },
  {
    title: 'Đăng nhập',
    path: '/login',
    icon: renderIcon('solar:lock-keyhole-minimalistic-bold-duotone'),
  },
  {
    title: 'Không tìm thấy',
    path: '/404',
    icon: renderIcon('solar:shield-warning-bold-duotone'),
  },
];
