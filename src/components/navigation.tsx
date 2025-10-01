import {
  NavigationMenu,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import roundup from '../assets/roundup.png'
import { Link } from "@radix-ui/react-navigation-menu"

const Navigation = () => {
  return (
    <NavigationMenu>
        <div className="flex items-center">
        <img
          width="150px"
          height="auto"
          src={roundup}
          alt="Round Up Logo"
          className="logo"
        />
        <NavigationMenuList>
          <NavigationMenuLink asChild className={""}>
            <Link href="/">Home</Link>
          </NavigationMenuLink>
          <NavigationMenuLink asChild className={""}>
            <Link href="/check-in"> Check-in </Link>
          </NavigationMenuLink>
          <NavigationMenuLink asChild className={""}>
            <Link href="/setup"> Setup </Link>
          </NavigationMenuLink>
          <NavigationMenuLink asChild className={""}>
            <Link href="/results"> Results </Link>
          </NavigationMenuLink>
        </NavigationMenuList>
        </div>
    </NavigationMenu>
  )
}

export default Navigation
