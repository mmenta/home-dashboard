# jellyfin

Runs on the VM as `/opt/jellyfin`; SWAG serves it at `jellyfin.experimenta.cc`
via `../swag/nginx/site-confs/jellyfin.conf`. Media is unraid's `menta-home`
share (`movies/`, `series/`, `moms-movies/`), mounted read-only on the VM by
this `/etc/fstab` line (guest SMB; the share allows anonymous read):

```
//192.168.68.55/menta-home /mnt/media cifs guest,ro,uid=1000,gid=1000,iocharset=utf8,vers=3.0,_netdev,nofail,x-systemd.automount 0 0
```

The library database and metadata live on the `jellyfin-config` named volume on
the cache SSD and are covered by the nightly backup. Point libraries at
`/media/movies`, `/media/series`, `/media/moms-movies` inside the container.
