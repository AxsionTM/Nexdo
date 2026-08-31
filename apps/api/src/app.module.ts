import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    // TODO: AuthModule, TasksModule, ProjectsModule, HabitsModule, GoalsModule, FocusModule, AIModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
