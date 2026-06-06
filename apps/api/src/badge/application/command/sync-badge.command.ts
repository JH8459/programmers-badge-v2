import { Inject } from "@nestjs/common";
import { Command, CommandHandler, type ICommandHandler } from "@nestjs/cqrs";

import {
  parseBadgeSyncPayload,
  type BadgeSyncPayload,
} from "@programmers-badge/shared-types";

import {
  BadgeProfileRepository,
  type BadgeProfileRecord,
} from "../../infra/badge-profile.repository";

export class SyncBadgeCommand extends Command<BadgeProfileRecord> {
  constructor(public readonly props: SyncBadgeCommandProps) {
    super();
  }
}

@CommandHandler(SyncBadgeCommand)
export class SyncBadgeCommandHandler implements ICommandHandler<SyncBadgeCommand> {
  constructor(
    @Inject(BadgeProfileRepository)
    private readonly badgeProfileRepository: BadgeProfileRepository
  ) {}

  async execute(command: SyncBadgeCommand): Promise<BadgeProfileRecord> {
    const normalizedPayload = parseBadgeSyncPayload(command.props.payload);

    return this.badgeProfileRepository.upsert(normalizedPayload);
  }
}

interface SyncBadgeCommandProps {
  readonly payload: BadgeSyncPayload;
}
