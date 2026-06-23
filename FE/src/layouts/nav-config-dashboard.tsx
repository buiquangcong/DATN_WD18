import { Label } from 'src/components/label';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} />;

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
    icon: icon('ic-analytics'),
  },
  {
    title: 'Danh sách xe',
    path: '/admin/bus/list',
    icon: icon('ic-user'),
  },
  {
    title: 'Danh sách nhân viên',
    path: '/admin/staff/list',
    icon: icon('ic-cart'),
  },
  {
    title: 'Danh sách chuyến đi',
    path: '/admin/trip/list',
    icon: icon('ic-blog'),
  },
  {
    title: 'Danh sách tuyến đường',
    path: '/admin/journey/list',
    icon: icon('ic-blog'),
  },
  {
 title: 'Danh sách tài khoản',
 path: '/admin/tk/list',
  icon: icon('ic-blog'),
  },
  {
 title: 'Danh sách Booking',
 path: '/admin/booking/list',
  icon: icon('ic-blog'),
  },
  {
    title: 'Danh sách giá vé',
    path: '/admin/giave/list',
    icon: icon('ic-blog'),
  },
  {
    title: 'Blog',
    path: '/admin/blog',
    icon: icon('ic-blog'),
  },
  {
    title: 'Đăng nhập',
    path: '/login',
    icon: icon('ic-lock'),
  },
  {
    title: 'Không tìm thấy',
    path: '/404',
    icon: icon('ic-disabled'),
  },
];
