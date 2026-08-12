alter table public.delta_ribbon_frames
    drop constraint delta_ribbon_frames_race_id_driver_a_id_driver_b_id_path_pe_key;

alter table public.delta_ribbon_frames
    alter column lap set not null;

alter table public.delta_ribbon_frames
    add constraint delta_ribbon_frames_unique_frame
    unique (race_id, driver_a_id, driver_b_id, lap, path_percent);
