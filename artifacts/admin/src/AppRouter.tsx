import { Switch, Route } from "wouter";
import Dashboard from "@/pages/Dashboard";
import MoviesList from "@/pages/movies/List";
import MovieForm from "@/pages/movies/Form";
import SeriesList from "@/pages/series/List";
import SeriesForm from "@/pages/series/Form";
import SeasonsList from "@/pages/seasons/List";
import EpisodesList from "@/pages/episodes/List";
import CategoriesList from "@/pages/categories/List";
import UsersList from "@/pages/users/List";
import BannersList from "@/pages/banners/List";
import Analytics from "@/pages/analytics/Index";
import Plans from "@/pages/plans/Index";
import ImportPage from "@/pages/import/Index";
import SettingsPage from "@/pages/settings/Index";

export function AppRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/analytics" component={Analytics} />

      {/* Movies */}
      <Route path="/movies" component={MoviesList} />
      <Route path="/movies/new" component={MovieForm} />
      <Route path="/movies/:id/edit" component={MovieForm} />

      {/* Series */}
      <Route path="/series" component={SeriesList} />
      <Route path="/series/new" component={SeriesForm} />
      <Route path="/series/:id/edit" component={SeriesForm} />
      <Route path="/series/:id/seasons" component={SeasonsList} />

      {/* Episodes */}
      <Route path="/seasons/:id/episodes" component={EpisodesList} />

      {/* Categories */}
      <Route path="/categories" component={CategoriesList} />

      {/* Users */}
      <Route path="/users" component={UsersList} />

      {/* Banners */}
      <Route path="/banners" component={BannersList} />

      {/* Plans */}
      <Route path="/plans" component={Plans} />

      {/* TMDB Import */}
      <Route path="/import" component={ImportPage} />

      {/* Settings */}
      <Route path="/settings" component={SettingsPage} />
      <Route path="/settings/security" component={SettingsPage} />

      <Route>
        <div className="p-8 text-center text-muted-foreground">Not Found</div>
      </Route>
    </Switch>
  );
}
