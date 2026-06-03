import Header from "./components/Header.jsx";
import LightCard from "./components/LightCard.jsx";
import AirQualityCard from "./components/AirQualityCard.jsx";
import SensorCard from "./components/SensorCard.jsx";
import { useEntities } from "./hooks/useEntities.js";
import { LIGHTS, AIR_QUALITY, CONTACT_SENSORS } from "./config/entities.js";

export default function App() {
  const { states, error, loading, refresh } = useEntities();

  return (
    <div className="app">
      <Header error={error} onRefresh={refresh} />

      {loading ? (
        <p className="loading">Loading devices…</p>
      ) : (
        <main>
          <section>
            <h2>Lights</h2>
            <div className="grid">
              {LIGHTS.map((l) => (
                <LightCard
                  key={l.entityId}
                  name={l.name}
                  entity={states[l.entityId]}
                  onChanged={refresh}
                />
              ))}
            </div>
          </section>

          <section>
            <h2>Air Quality</h2>
            <div className="grid stats">
              {AIR_QUALITY.map((s) => (
                <AirQualityCard
                  key={s.entityId}
                  name={s.name}
                  unitFallback={s.unitFallback}
                  entity={states[s.entityId]}
                />
              ))}
            </div>
          </section>

          <section>
            <h2>Doors & Windows</h2>
            <div className="grid">
              {CONTACT_SENSORS.map((s) => (
                <SensorCard key={s.entityId} name={s.name} entity={states[s.entityId]} />
              ))}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}
