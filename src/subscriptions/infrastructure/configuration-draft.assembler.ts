import { HomeConfiguration, type RoomConfiguration } from '../domain/model/home-configuration.ts';
import type { ConfigurationDraftResource, ConfiguredRoomResource } from './configuration-draft.resources.ts';

function toRoom(resource: ConfiguredRoomResource): RoomConfiguration {
  return {
    id: resource.key,
    name: resource.name,
    devices: {
      LIGHT: resource.lights,
      DOOR: resource.doors,
      WINDOW: resource.windows,
      CURTAIN: resource.curtains,
      MICROPHONE: resource.microphones,
    },
  };
}

export const ConfigurationDraftAssembler = {
  toEntity(resource: ConfigurationDraftResource): HomeConfiguration {
    return new HomeConfiguration({
      draftId: resource.id,
      planCode: resource.planCode,
      billingPeriod: resource.billingCycle,
      rooms: resource.rooms.map(toRoom),
      quote: resource.quote === null
        ? null
        : {
            currency: resource.quote.currency,
            rooms: resource.quote.rooms,
            baseMonthlyAmount: Number(resource.quote.baseMonthlyAmount),
            additionalRoomsMonthlyAmount: Number(resource.quote.additionalRoomsMonthlyAmount),
            devicesMonthlyAmount: Number(resource.quote.devicesMonthlyAmount),
            totalMonthlyAmount: Number(resource.quote.totalMonthlyAmount),
          },
      updatedAt: resource.updatedAt,
    });
  },

  toRoomResource(room: RoomConfiguration): ConfiguredRoomResource {
    return {
      key: room.id,
      name: room.name,
      lights: room.devices.LIGHT,
      doors: room.devices.DOOR,
      windows: room.devices.WINDOW,
      curtains: room.devices.CURTAIN,
      microphones: room.devices.MICROPHONE,
    };
  },
};
