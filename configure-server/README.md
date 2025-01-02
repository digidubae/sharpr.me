# Configure the server

## Prerequisites
- Ubuntu server with Docker (tested with digitalocean droplet image docker-20-04)
- .env file that matches the .env.example file in the root of the repository.  it should be placed in the home directory of the ansible user.
- You should be able to ssh to the server using SSH key

## Run the playbook
```
ansible-playbook -i inventory.ini -v one-time-setup.yml
```

## What does the playbook do?
- Disable iptables management by docker to prevent conflicts with ufw
- Creates and runs a script (configure-ufw.sh) that configures ufw to only allow https incoming traffic from cloudflare
- Creates a crontjob to run the above script every day to ensure staying up to date with cloudflare ip addresses
- clone the sharpr.me repository and runs docker with the .env file in the home directory of the ansible user
- runs the docker compose file
