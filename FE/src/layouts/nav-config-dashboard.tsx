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
